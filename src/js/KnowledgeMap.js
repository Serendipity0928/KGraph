let $ = layui.jquery,
    element = layui.element,
    tree = layui.tree,
    layer = layui.layer,
    util = layui.util;

$(function () {
  //layui组件初始化
  layui_init();

  //左边栏Control
  left_Control();

  $.ajax({
    url: "http://115.29.165.26/operations/person/graph/",
    type: 'POST'
    ,data: {"typed": 'Main'}
    , success: function (data) {
      //D3绘图
      D3_Fun(data)
    }
    , error: function () {
      layer.msg('An error occurred in the requested data due to unknown reasons.', {
        icon: 5
      })
    }
  })

});



function layui_init() {
    element.on('tab(ThemeTab)', function(data){
      console.log(data.index);
      if(data.index === 2){
        $('.main-content').addClass('layui-hide')
      }else{
        $('.main-content').removeClass('layui-hide')
      }
    });

    tree.render({
      elem: '#test12'
      ,showCheckbox: true
      ,id: 'TreeID'
      ,isJump: true
      ,click: function(obj){
        let data = obj.data;
        let flag = false;
        $('.rect—btn').each(function () {
          if($(this).next().text().trim() === data.title) {
            flag = true
          }
        });
        if(flag) {
          return false
        }
      }
    });
}


//左边栏Control
function left_Control() {
  //关联类型选择
  LinkType_select()
}

//关联类型选择
function LinkType_select() {
  let btn_all = $('.btn-wp')
  btn_all.click(function () {
    btn_all.removeClass('active')
    $(this).addClass('active')
    $('#con_title').html($(this).children('button').text().trim())
    LinkContent_change($(this).children('button').text().trim())
  })
}

//关联内容切换 --- 关闭
function LinkContent_change(type) {
  let params;
  switch (type) {
    case '掌握程度':
      $.ajax({
        url: 'http://115.29.165.26/operations/person/graph/'
        ,type: 'POST'
        ,data: {
          "typed": 'Main'
        }
        ,success: function (data) {
          Refresh_map(data)
        }
        ,error: function () {
          alert('An error occurred in the requested data due to unknown reasons.');
        }
      });
      break;
    case '章节展示':
      break;
    case '课程安排':
      break;
    case '巩固规划':
      break;
    case '提高规划':
      break;
    default:
      break
  }
}

// 删除挂载原型
Array.prototype.delete=function(delIndex){
  let temArray=[];
  for(let i = 0;i < this.length; i++){
    if(i !== delIndex){
      temArray.push(this[i]);
    }
  }
  return temArray;
}
//排序挂载原型
Array.prototype.SubSort = function(nodes) {
  return this.sort((a, b) => nodes[a.target].sub - nodes[b.target].sub)
}


//Json转换
function Array_standard(js) {
  let retArray = {}
  retArray['title'] = js['name']
  retArray['id'] = js['id']
  if(js['children'].length !== 0){
    retArray['children'] = []
    js['children'].forEach(function (d) {
      retArray['children'].push(Array_standard(d))
    })
  }
  return retArray
}


//树形组件数据处理
function Tree_data_pro(nodes, links, color) {
  nodes.forEach(function (d, index) {
    d['children'] = []
  });

  links.SubSort(nodes);

  links.forEach(function (l) {
    if(nodes[l.source].category === nodes[l.target].category){
      if(nodes[l.target].sub === 0) {
        nodes[l.source].children.push(nodes[l.target]);
        nodes[l.source].sub -= 1;
        nodes[l.target].sub -= 1      //出去不管了 只需要遍历得到sub === 0 的节点即可
      }else {
        nodes[l.source].sub -= 1      //中间解构
      }
    }else {
      nodes[l.source].sub -= 1
    }
  });

  // console.log(nodes);
  let data = [];
  for(let i = 1; i <= color.length; i++){
    let loo = {
      title: color[i-1].title
      ,id: -i
      ,checked: false
      ,spread: true
      ,children:[]
    };
    data.push(loo)
  }

  nodes.forEach(function (d) {
    if(d.sub === 0){
      data[d.category].children.push(Array_standard(d))
    }
  })

  Tree_update(data)
}

//树形组件更新
function Tree_update(data) {
  tree.reload('TreeID', {
    data: data
  });
}

// D3.js绘图区
function D3_Fun(data) {
  let $svg_wp = $('#SvgWp')
  var width = $svg_wp.width(), height = $svg_wp.height();

  let svg = d3.select('#SvgWp').append('svg')
    .attr('id', 'mainsvg')
    .attr('class', 'svgs')
    .attr("width", width)
    .attr("height", height)
    .on('click', function () {
      circle_btn.attr('class', d => {return 'nodebtn hidebtn btn' + d.index})
    })

  let nodes, links;
  let circles, lines;
  let color;
  let simulation;
  let edges_text, circle_text
  let circle_btn
  let legend


//1. 定义拖拽时候的函数
  function dragstarted(d) {
    // console.log(d);
    d3.select(this).raise().attr("stroke", "black").attr('r', 14);
    simulation.stop();
  }

  function dragged(d) {
    d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    ticked();
  }

  function dragended(d) {
    d3.select(this).attr("stroke", null).attr('r', 8);
    // simulation.restart();
  }

  //1. 定义拖拽时候的函数
  const drag = d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);

  //2. 定义tip
  const tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function (d) {
      return d.name
    })
  svg.call(tip);

  //3. 定义缩放
  function zoomed() {
    svg.attr("transform", d3.event.transform);
  }

  //3. 定义缩放
  svg.call(d3.zoom()
    .extent([[0, 0], [width, height]])
    .scaleExtent([-5, 1.2])
    .on("zoom", zoomed));

  //4. 定义MainGroup
  let g = svg.append("g")

  //5.定义箭头1和箭头2
  let defs = g.append("defs");
  let arrow_path = "M2,2 L10,6 L2,10 L6,6 L2,2";
  let arrowMarker = defs.append("marker")
    .attr("id", "arrow")
    .attr("markerUnits", "userSpaceOnUse")
    .attr("markerWidth", "12")
    .attr("markerHeight", "12")
    .attr("viewBox", "0 0 12 12")
    .attr("refX", "18")
    .attr("refY", "6")
    .attr("orient", "auto")

  arrowMarker.append("path")
    .attr("d", arrow_path)
    .attr("fill", "#d4d4d4");

  let arrowMarker_red = defs.append("marker")
    .attr("id", "arrow_red")
    .attr("markerUnits", "userSpaceOnUse")
    .attr("markerWidth", "12")
    .attr("markerHeight", "12")
    .attr("viewBox", "0 0 12 12")
    .attr("refX", "18")
    .attr("refY", "6")
    .attr("orient", "auto");

  arrowMarker_red.append("path")
    .attr("d", arrow_path)
    .attr("fill", "red");

  //9. 定义节点按钮
  text_defs();

  //6. 初始化渲染
  let render_init = function () {
    //节点连线 g1(line circle)
    lines = g.selectAll('.edgepath').data(links)
      .enter().append('path')
      .attr('class', 'edgepath')
      .attr('stroke', function (d) {
        if(d.path === 1){
          return 'red'
        }
        return '#d4d4d4'
      })
      // .attr('stroke', '#d4d4d4')
      .attr('opacity', 0.8)
      .attr('stroke-width', 1)
      .attr('id', function (d, i) {
        return 'edgepath' + i;
      });

    //连线说明 g3(text)
    edges_text = svg.append("g").selectAll(".edgelabel")
      .data(links)
      .enter().append("text")
      .attr('class', 'edgelabel')
      .style('fill', '#cde6c7')
      .style('font-size', '10')
      .attr('text-anchor', 'middle');

    edges_text.append('textPath')
      .attr('xlink:href', function (d, i) {
        return '#edgepath' + i
      })
      .style("pointer-events", "none")
      .text(function (d) {
        //这里暂时没有说明文字  可选
        return d.des;
      });

    //节点 g1(line circle)
    circles = g.selectAll('circle').data(nodes).enter()
      .append('circle')
      .attr('r', 8)
      .attr('fill', d => color[d.category].val)
      .attr('id', d => 'circle' + d.index)
      .on('contextmenu', function (d) {
        d3.event.preventDefault();
        console.log("右击");
        console.log(d.sub);
        d3.selectAll('.nodebtn').attr('class', d => {
          return 'nodebtn hidebtn btn' + d.index
        });
        d3.select('.btn' + d.index)
          .attr('class', 'nodebtn btn' + d.index)
      })
      .on('mouseover', function (d) {
        tip.show(d)
      })
      .on('mouseout', function (d) {
        tip.hide(d)
      })
      .call(drag);

    //g4(node_btn)
    circle_btn = svg.append('g').selectAll('.nodebtn')
      .data(nodes).enter()
      .append('g')
      .attr('class', function (d) {
        let cla = 'btn' + d.index;
        return 'nodebtn hidebtn ' + cla
      });

    Node_btn_def();

    circle_text = svg.append('g').selectAll('.nodelabel')
      .data(nodes).enter()
      .append('text')
      .attr('class', 'nodelabel')
      .attr("dy", "1em")
      .attr("text-anchor", "middle")  //在圆圈中加上数据
      .attr('fill', function (d) {
        if(d.map_type === 'Plan'){
          return color[d.category].val
        }
        return '#c23531'
      })
      .text(d => {
        return d.name
      })
      .attr('x', 0)
      .attr('y', 2);

    //图例初始化
    let add_html = '';
    color.forEach(function (d, index) {
      add_html += '<div class="rect—btn" style="background: ' + d.val + '"></div><span>' + d.title + '</span>'
    });
    $('#Js_legend').html(add_html)
  };

  //7. tick函数
  function ticked() {
    nodes.forEach(function (d) {
      if (d.x < 60) {
        d.x = 60
      } else if (d.x > width - 60) {
        d.x = width - 60
      }
      if (d.y < 60) {
        d.y = 60
      } else if (d.y > height - 60) {
        d.y = height - 60
      }
    })

    lines
      .attr('d', function (d) {
        return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y
      })
      .attr("marker-end", function (d) {
        if(d.path === 1){
          return "url(#arrow_red)"
        }
        return "url(#arrow)"
      })


    edges_text.attr('transform', function (d, i) {
      if (d.target.x < d.source.x) {
        if ($(this).css('display') === 'none' || !$(this).css('display')) {
          return 'rotate(0)';
        }else{
          let bbox = this.getBBox();

          let rx = bbox.x + bbox.width / 2;
          let ry = bbox.y + bbox.height / 2;
          return 'rotate(180 ' + rx + ' ' + ry + ')';
        }

      } else {
        return 'rotate(0)';
      }
    }).attr('x', function (d) {
      let dx = Math.abs(d.source.x - d.target.x);
      let dy = Math.abs(d.source.y - d.target.y);
      return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)) / 2;
    })

    circles
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)

    circle_text
      .attr("transform", d => {
        return "translate(" + (d.x) + "," + (d.y + 5) + ")"
      }); //顶点文字

    circle_btn
      .attr("transform", d => {
        return "translate(" + (d.x) + "," + d.y + ")"
      });
  }

  //8. 请求初始化图谱的数据
  get_then(data)

  //初始化图谱
  function get_then(data) {
    links = data.links;
    nodes = data.nodes
    color = data.color

    // console.log(data);

    Tree_data_pro(nodes, links, color)     //传递给树形图

    $('#Js_nodes_num').html(data['#nodes'])
    for (let i = 0; i < data['#nodes']; i++) {
      nodes[i]['index'] = i
    }
    // color = d3.scaleDiverging(d3.interpolateRainbow)
    // .domain([0, 10])

    render_init();

    simulation = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-10).theta(0.2).distanceMax(width/4))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force("link", d3.forceLink(links).distance(function (d) {
        let deg = d.source.subNum;
        const base_len = 35;
        if(deg <= 5) {
          return base_len
        }else {
          return base_len + (deg - 5) * 5
        }
        // const A = 30;
        // if(deg < 1) {
        //   return A - 10
        // } else if (deg >= 4) {
        //   return 3 * A
        // } else {
        //   return deg * A
        // }
      }))
      .force("collision", d3.forceCollide().radius(function () {
        return 20;
      }).strength(0.2))
      .force('positionY', d3.forceY().strength(0.006))
      .force('myforce', my_force(2))
      .alphaTarget(0.8)
      .on('tick', ticked);
  }

  // 自定义力
  function my_force(alpha) {
    for (var i = 0, n = nodes.length, node, k = alpha * 0.1; i < n; ++i) {
      node = nodes[i];
      const x_value = node.x - width/2;
      const y_value = node.y - height/2;
      const values = (4*x_value*x_value)/(height*height) + (4*y_value*y_value)/(width*width);
      if(values >= 1){
        node.vx = -node.vx;
        node.vy = -node.vy;
      }
    }
  }

  //定义按钮细节
  function Node_btn_def()  {
    // node_def = d3.selectAll('.nodebtn')

    const action_list = ['action0', 'action1', 'action2', 'action3', 'action4']
    const d_list = {
      'action0': 'M3.67394039744206e-15,-60A60,60,0,0,1,57.06339097770921,-18.541019662496844L28.531695488854606,-9.270509831248422A30,30,0,0,0,1.83697019872103e-15,-30Z',
      'action1': 'M57.06339097770921,-18.541019662496844A60,60,0,0,1,35.26711513754839,48.54101966249685L17.633557568774194,24.270509831248425A30,30,0,0,0,28.531695488854606,-9.270509831248422Z',
      'action2': 'M35.26711513754839,48.54101966249685A60,60,0,0,1,-35.26711513754838,48.54101966249685L-17.63355756877419,24.270509831248425A30,30,0,0,0,17.633557568774194,24.270509831248425Z',
      'action3': 'M-35.26711513754838,48.54101966249685A60,60,0,0,1,-57.06339097770922,-18.541019662496836L-28.53169548885461,-9.270509831248418A30,30,0,0,0,-17.63355756877419,24.270509831248425Z',
      'action4': 'M-57.06339097770922,-18.541019662496836A60,60,0,0,1,-1.1021821192326178e-14,-60L-5.510910596163089e-15,-30A30,30,0,0,0,-28.53169548885461,-9.270509831248418Z'
    }
    const test_list = {
      'action0': ['资 源', 'translate(26.45033635316129,-36.405764746872634)'],
      'action1': ['选 择', 'translate(42.79754323328191,13.905764746872633)'],
      'action2': ['详 情', 'translate(2.7554552980815448e-15,45)'],
      'action3': ['编 辑', 'translate(-42.79754323328191,13.905764746872638)'],
      'action4': ['问 答', 'translate(-26.450336353161298,-36.40576474687263)']
    }
    for (let cla of action_list) {
      let act = circle_btn.append('g')
        .attr('class', 'action ' + cla)
        .style('cursor', 'pointer')
        .on('click', function (d) {
          Menu_click(cla, d)
        })

      act
        .append('path')
        .attr('d', d_list[cla])
        .attr('fill', '#D2D5DA')
        .attr('stroke', '#f0f0f4')
        .attr('stroke-width', 2)
        .style('opacity', 0.8)

      act
        .append('text')
        // .text(test_list[cla][0])
        // .attr('transform', test_list[cla][1])
        .attr('font-size', 10)
        .attr('fill', '#333')
        .attr('text-anchor', 'left')
        .append('textPath')
        .attr('xlink:href', '#' + cla)
        .text(test_list[cla][0])
        .attr('startOffset', 12)
    }
  }

  //定义按钮action样式 g2(defs)
  function text_defs() {
    let mydefs = svg.append('g').append('defs')

    mydefs.append('path')
      .attr('id', 'action0')
      .attr('d', 'M3.67394039744206e-15,-40A40,40,0,0,1,37.06339097770921,-18.541019662496844')

    mydefs.append('path')
      .attr('id', 'action1')
      .attr('d', 'M37.96339097770921,-14.041019662496844A41,41,0,0,1,23.506667,32.36')

    mydefs.append('path')
      .attr('id', 'action2')
      // .attr('d', 'M23.506667,32.36A40,40,0,0,1,-23.506667,32.36')
      // .attr('d', 'M-26.4442643,36.4039873A46,46,0,0,0,26.4442643,36.4039873')
      .attr('d', 'M-25.4442643,38.4039873A48,48,0,0,0,27.4442643,38.4039873')

    mydefs.append('path')
      .attr('id', 'action3')
      .attr('d', 'M-24.0442643,34.0039873A38,38,0,0,1,-37.96339097770921,-14.541019662496844')

    mydefs.append('path')
      .attr('id', 'action4')
      .attr('d', 'M-37.96339097770921,-14.541019662496844A40,40,0,0,1,0,-40')
  }

  //监听刷新事件
  let fresh = $('#fresh')
  fresh.unbind('click')
  fresh.click(function () {
    simulation.stop();
    circle_btn.attr('class', d => {
      return 'nodebtn hidebtn btn' + d.index
    })
    for (item of nodes) {
      item.x = width / 2
      item.y = height / 2
    }

    svg.attr("transform", "translate(0,0)")
    width = $svg_wp.width()
    height = $svg_wp.height();
    $('#Js_search').next('input').val('')
    simulation.restart();
  })

  //搜索事件
  let Js_search = $('#Js_search')
  Js_search.unbind('click')
  Js_search.click(function () {
    let val = $(this).next('input').val()
    let this_index = -1
    let this_cate = -1
    for (item of nodes) {
      if (item.name === val) {
        this_index = item.index
        this_cate = item.category
        break
      }
    }
    if (this_index === -1) {
      layer.msg('暂未查找到这个知识点');
    } else {
      let this_sel = d3.select('#circle' + this_index)
      let myflash = setInterval(function () {
        setColor(this_sel, color[this_cate].val)
      }, 400);
      setTimeout(function () {
        clearInterval(myflash);
      }, 6000)
    }

  })

}

//修改颜色值
function setColor(sel, this_color) {

  if(sel.attr('fill') !== 'white'){
    sel.attr('fill', 'white')
  }else{
    sel.attr('fill', this_color)
  }
}

//右击菜单
function Menu_click(opt, d) {
  switch (opt) {
    case 'action0' :
      // '资源'
      break
    case 'action1' :
      tree.setChecked('TreeID', d.id); //单个勾选 id 为 1 的节点
      break
    case 'action2' :
      break
    case 'action3' :
      break
    case 'action4' :
      break
  }
}

//刷新力引导
function Refresh_map(data) {
  try {
    $("svg").remove()
    D3_Fun(data)
  } catch (e) {console.log(e);}
}


//封装
function request(params) {
  return new Promise(((resolve, reject) => {
    $.ajax({
      ...params
      ,success: function (result) {
        if(result.status === 'success') {
          resolve(result)
        }else{
          layer.msg(result.msg, {
            icon: 2
          })
        }
      }
      ,error: function (err) {
        layer.msg('An error occurred in the requested data due to unknown reasons.', {
          icon: 5
        })
      }
    })
  }))
}

function request_ajax(params) {
  $.ajax({
  ...params
  , success: function (data) {
    if(data.status==="success"){
      Refresh_map(data.content)
    }else if(data.status === "failure") {
      layer.msg(data.msg)
    }else {
      Refresh_map(data)
    }
  }
  , error: function () {
    alert('An error occurred in the requested data due to unknown reasons.');
  }
})
}