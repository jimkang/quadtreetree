// opts should contain:
// 
// {
//   rootSelector: a selector for a <g> under which to render the tree
// }

function createQuadtreetree(opts) {
  var quadtreetree = {
    animationDuration: 750,
    maxLabelWidth: 50,
    update: null
  };

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

  function savePositionToPrevious(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  }

  function compose(f, g) {
    return function composedFunction(x) {
      return g(f(x));
    };
  }

  function sendEvent(eventName, info) {
    var event = new CustomEvent(eventName, {detail: info});
    document.dispatchEvent(event);
  }

  var root = d3.select(opts.rootSelector);
  var idmaker = createIdmaker();
  var generateBezierPath = d3.svg.diagonal().projection(swapXAndYInPoint);
  var tree = d3.layout.tree().nodeSize([32, 32]);

  quadtreetree.update = function update(quadtree) {
    var layoutTree = quadtreeToLayoutTree(quadtree);
    // Compute the positions for nodes and links.
    var nodes = tree.nodes(layoutTree).reverse();
    nodes.forEach(compose(swapXAndYInLayoutTreeNode, normalizeXToFixedDepth));
    var links = tree.links(nodes);

    syncDOMToLinks(links);
    syncDOMToNodes(nodes);
  };

  function syncDOMToNodes(nodes) {
    var renderedNodes = root.selectAll('g.node')
      .data(nodes, accessors.id)
      .attr('id', accessors.id)
      .classed('new', false);

    // Enter any new nodes at their previous positions.
    var entrants = renderedNodes.enter().append('g').attr({
      class: 'node',
      transform: accessors.translateToPosition0,
      id: accessors.id
    })
    .on('click', function notifyThatNodeWasSelected(d) {
      sendEvent('quadtreetree-nodeSelected', d);
    });

    entrants.append('circle').attr('r', 1e-6);

    // Transition nodes to their new positions.
    var updatees = renderedNodes.transition()
      .duration(quadtreetree.animationDuration)
      .attr('transform', accessors.translateToPosition);

    updatees.select('circle').attr('r', 12);

    // Transition exiting nodes to their previous positions.
    var exiters = renderedNodes.exit().transition()
      .duration(quadtreetree.animationDuration)
      .attr('transform', accessors.translateToPosition0)
      .remove();

    exiters.select('circle').attr('r', 1e-6);

    var dotUpdatees = renderedNodes.selectAll('circle');
    dotUpdatees.attr('fill', accessors.color);

    // Stash the old positions for transitions.
    nodes.forEach(savePositionToPrevious);

    // Mark the new nodes with the 'new' style.
    entrants.classed('new', true);

    sendEvent('quadtreetree-dotsEntered', entrants);
  }

  function syncDOMToLinks(links) {
    // Update the links.
    var renderedLinks = root.selectAll('path.link')
      .data(links, accessors.targetId);

    // Enter any new links at their previous positions.
    renderedLinks.enter().insert('path', 'g')
      .attr('class', 'link')
      .attr('d', generateBezierPath);

    // Transition links to their new positions.
    renderedLinks.attr('d', generateBezierPath).attr('stroke-width', 3);

    // Transition exiting links to their previous positions.
    renderedLinks.exit().transition()
      .duration(quadtreetree.animationDuration)
      .attr('d', generateBezierPath)
      .remove();
  }

  return quadtreetree;
}

