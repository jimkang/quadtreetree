// opts should contain:
// 
// {
//   quadtree: a d3.geom.quadtree, 
//   rootSelector: a selector for a <g> under which to render the tree
//   boardSelector: a selector for an <svg> containing the tree
// }

function quadtreetree(opts) {
  var quadtreetree = {
    animationDuration: 750,
    maxLabelWidth: 50,
    camera: null,
    update: null
  };

  var root = null;
  var idmaker = null;
  var tree = null;
  var diagonalProjection = null;

  function swapXAndYInPoint(d) { 
    return [d.y, d.x]; 
  }

  // The tree layout generates a left-to-right tree by default, and we want a 
  // top-to-bottom tree, so we need to flip x and y when we talk to it.  
  function swapXAndYInLayoutTreeNode(d) {
    var oldX = d.x;
    var oldX0 = d.x0;
    d.x = d.y;
    d.x0 = d.y0;
    d.y = oldX;
    d.y0 = oldX0;
    return d;
  }

  function normalizeXToFixedDepth(d) {
    d.x = d.depth * 120;
    return d;
  }

  function identity(d) {
    if (!d.id) {
      debugger;
    }
    return d.id;
  }

  (function init() {
    root = d3.select(opts.rootSelector);
    idmaker = createIdmaker();
    // The tree layout generates a left-to-right tree by default, and we want a 
    // top-to-bottom tree, so we flip x and y when we talk to it.
    diagonalProjection = d3.svg.diagonal().projection(swapXAndYInPoint);

    tree = d3.layout.tree();
    tree.nodeSize([32, 32]);

    quadtreetree.camera = createCamera(opts.boardSelector, opts.rootSelector, 
      [0.2, 2]);
  }());

  quadtreetree.update = function update(quadtree) {
    var layoutTree = quadtreeToLayoutTree(quadtree);

    // Compute the new tree layout.
    var nodes = tree.nodes(layoutTree).reverse();
    nodes.forEach(function transformTreeNode(d) {
      normalizeXToFixedDepth(swapXAndYInLayoutTreeNode(d));
    });
    var links = tree.links(nodes);

    syncDOMToNodes(nodes, links, layoutTree);
    syncDOMToLinks(nodes, links, layoutTree);
  }

  function syncDOMToNodes(nodes, links, layoutTree) {
    var renderedNodes = root.selectAll('g.node')
      .data(nodes, identity)
      .attr('id', identity)
      .classed('new', false);

    // Enter any new nodes at the parents' previous positions.
    var entrants = renderedNodes.enter().append('g')
      .attr('class', 'node')
      .attr('transform', function() { 
        return 'translate(' + layoutTree.y0 + ',' + layoutTree.x0 + ')'; 
      })
      .attr('id', identity)
      .on('click', function showCorrespondingEl(d) {
      });

    entrants.append('circle').attr('r', 1e-6);

    entrants.append('text')
      .attr('x', function(d) { 
        return d.children || d._children ? '0.3em' : '-0.3em'; 
      })
      .attr('y', '-1em')
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .text(function(d) { return d.title; })
      .style('fill-opacity', 1e-6);

    // Transition nodes to their new position.
    var updatees = renderedNodes.transition()
      .duration(quadtreetree.animationDuration)
      .attr('transform', function(d) { return 'translate(' + d.y + ',' + d.x + ')'; });

    updatees.select('circle').attr('r', 12);

    updatees.select('text')
      .style('fill-opacity', function (d) { 
        return 1.0;
      }
      .bind(this))
      .call(wrap, function getTitle(d) { return d.title; }, 
        quadtreetree.maxLabelWidth);

    // Transition exiting nodes to the parent's new position.
    var exiters = renderedNodes.exit().transition()
      .duration(quadtreetree.animationDuration)
      .attr('transform', function() { 
        return 'translate(' + layoutTree.y + ',' + layoutTree.x + ')'; 
      })
      .remove();

    exiters.select('circle').attr('r', 1e-6);
    exiters.select('text').style('fill-opacity', 1e-6);

    var dotUpdatees = renderedNodes.selectAll('circle');
    dotUpdatees.attr('fill', function getColor(d) { 
      return d.color;
    });

    // Mark the new nodes with the 'new' style.
    entrants.classed('new', true);  
    // Pan to one of the new nodes.
    setTimeout(function pan() {
      quadtreetree.camera.panToElement(entrants, 750);
    },
    750);  
  }

  function syncDOMToLinks(nodes, links, layoutTree) {
    // Update the links.
    var link = root.selectAll('path.link')
      .data(links, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert('path', 'g')
      .attr('class', 'link')
      .attr('d', function() {
        var o = {x: layoutTree.x0, y: layoutTree.y0};
        return diagonalProjection({source: o, target: o});
      }
      .bind(this));

    // Transition links to their new position.
    link.attr('d', diagonalProjection).attr('stroke-width', 3);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
      .duration(quadtreetree.animationDuration)
      .attr('d', function getLinkData() {
        var o = {x: layoutTree.x, y: layoutTree.y};
        return diagonalProjection({source: o, target: o});
      }
      .bind(this))
      .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Based on https://gist.github.com/mbostock/7555321.
  function wrap(text, getTextData, width) {
    text.each(function(d) {
      // console.log('text.text()', text.text());
      var text = d3.select(this);
      var labelText = getTextData(d);
      var words = [];
      if (typeof labelText === 'string') {
        words = labelText.split(/\s+/).reverse();      
      }

      var word,
        line = [],
        lineHeight = 1.1, // ems
        y = text.attr('y'),
        dy = parseFloat(text.attr('dy')),
        tspan = text.text(null).append('tspan')
          .attr('x', 0).attr('y', y).attr('dy', dy + 'em');

      var tspans = [tspan];

      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(' '));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = text.append('tspan')
            .attr('x', 0).attr('y', y)
            .text(word);
          tspans.push(tspan);
        }
      }

      for (var i = 0; i < tspans.length; ++i) {
        var tspanToPlace = tspans[i];
        tspanToPlace.attr('dy', dy - (tspans.length - i - 1) * lineHeight + 'em');
      }
    });
  }

  function quadtreeToLayoutTree(quadtree) {
    var layoutNode = {
      id: 'tree_' + quadtree.label,
      color: quadtree.color,
      children: [],
      x0: 0,
      y0: 0
    };

    for (var i = 0; i < quadtree.nodes.length; ++i) {
      var child = quadtree.nodes[i];
      if (!child) {
        child = {
          label: 'unset_' + idmaker.randomId(),
          // title: 'Not set',
          color: 'white',
          nodes: []
        };
      }

      layoutNode.children.push(quadtreeToLayoutTree(child));
    }

    return layoutNode;
  }

  return quadtreetree;
}

