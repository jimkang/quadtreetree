function exhibitController() {
  var exhibit = {
    points: [],
    displayedPointRange: [0, 100],
    maxNumberOfPoints: 1000,
    padding: 8,
    detailsBox: d3.select('.details-box')
  };

  var boardWidth = 0;
  var boardHeight = 0;

  ((function captureBoardDimensions() {
    var boardEl = d3.select('#quadtreetree').node();

    boardWidth = boardEl.clientWidth;
    if (boardWidth < 1) {
      // This is necessary on Firefox.
      boardWidth = boardEl.parentElement.clientWidth;
    }

    boardHeight = boardEl.clientHeight;
    if (boardHeight < 1) {
      // This is necessary on Firefox.
      boardHeight = boardEl.parentElement.clientHeight;
    }

    boardWidth -= (2 * exhibit.padding);
    boardHeight -= (2 * exhibit.padding);
  })());

  function createPointRandomly() {
    return [
      ~~(Math.random() * boardWidth),
      ~~(Math.random() * boardHeight)
    ];
  }

  exhibit.displayedPoints = function displayedPoints() {
    return exhibit.points.slice(
      exhibit.displayedPointRange[0], exhibit.displayedPointRange[1]);
  };

  exhibit.points = d3.range(exhibit.maxNumberOfPoints).map(createPointRandomly);
  // exhibit.points = [
  //   [mapWidth - 1, mapHeight - 1], 
  //   [mapWidth - 10, mapHeight - 10], 
  //   [mapWidth - 100, mapHeight - 100]
  // ];

  exhibit.quadtree = exampleQuadtree(boardWidth, boardHeight, 
    exhibit.displayedPoints());

  exhibit.quadtreetree = createQuadtreetree({
    rootSelector: '#treeroot'
  });

  var camera = createCamera('#quadtreetree', '#treeroot', [0.2, 2]);

  document.addEventListener('quadtreetree-dotsEntered', zoomToDots);

  function zoomToDots(event) {
    var dots = event.detail;
    // Pan to one of the new dots.
    setTimeout(function pan() {
      camera.panToElement(dots, 750);
    },
    750);
  }

  exhibit.quadtreetree.update(exhibit.quadtree);


  // exhibit.quadmap = quadtreeMap({
  //   x: exhibit.padding, 
  //   y: exhibit.padding, 
  //   width: mapWidth, 
  //   height: mapHeight, 
  //   quadtree: exhibit.quadtree, 
  //   rootSelection: d3.select('#quadroot')
  // });

  // renderQuadtreePoints({
  //   points: exhibit.displayedPoints(),
  //   rootSelection: d3.select('#pointroot'),
  //   x: exhibit.padding,
  //   y: exhibit.padding,
  //   width: mapWidth, 
  //   height: mapHeight,
  // });

  // document.addEventListener('quadtreemap-quadSelected', reportSelectedQuad);
  // document.addEventListener('quadtreepoints-pointSelected', reportSelectedPt);

  // function reportSelectedQuad(e) {
  //   var quad = e.detail;
  //   var quadtreenode = 
  //     cleanNodeForPresentation(decircularizeQuadtreeNode(quad.quadtreenode));
  //   exhibit.detailsBox.text(JSON.stringify(quadtreenode, null, '  '));
  // }

  // function reportSelectedPt(e) {
  //   var point = e.detail;
  //   exhibit.detailsBox.text(JSON.stringify(point));    
  // }

  function decircularizeQuadtreeNode(node) {
    var safeNode = _.omit(node, 'nodes', 'parent');

    if (node.nodes) {
      safeNode.nodes = node.nodes.map(function cleanChild(child) {
        return _.omit(child, 'nodes', 'parent');
      });
    }
    return safeNode;
  }

  // Assumes circular refs have been removed from node.
  function cleanNodeForPresentation(node) {
    ['point', 'x', 'y'].forEach(function removePropertyIfEmpty(property) {
      if (!node[property]) {
        delete node[property];
      }
      if (node.nodes) {
        node.nodes.forEach(cleanNodeForPresentation);
      }
    });
    return node;
  }
 
  return exhibit;
}


var theExhibit = exhibitController();

