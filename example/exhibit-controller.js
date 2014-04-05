function exhibitController() {
  var points = [];
  var currentPointRange = [0, 200];
  var maxNumberOfPoints = 1000;
  var padding = 8;
  var detailsBox = d3.select('.details-box');
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

    boardWidth -= (2 * padding);
    boardHeight -= (2 * padding);
  })());

  function createPointRandomly() {
    return [
      ~~(Math.random() * boardWidth),
      ~~(Math.random() * boardHeight)
    ];
  }

  function pointsInRange() {
    return points.slice(currentPointRange[0], currentPointRange[1]);
  };

  points = d3.range(maxNumberOfPoints).map(createPointRandomly);
  
  quadtree = exampleQuadtree(boardWidth, boardHeight, pointsInRange());

  quadtreetree = createQuadtreetree({
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

  document.addEventListener('quadtreetree-nodeSelected', reportSelectedNode);

  function reportSelectedNode(e) {
    var report = quadtreeNodeReport(e.detail.sourceNode);
    report = dropQuadtreetreeSpecifics(report);
    detailsBox.text(JSON.stringify(report, null, '  '));
  }

  function dropQuadtreetreeSpecifics(node) {
    var cleaned = _.omit(node, 'label', 'color');
    cleaned.nodes = cleaned.nodes.map(function cleanNode(child) {
      return _.omit(child, 'label', 'color');
    });
    return cleaned;
  }

  quadtreetree.update(quadtree);

  setTimeout(function addMoreNodes() {
    currentPointRange[0] += 100;
    currentPointRange[1] += 200;

    pointsInRange().forEach(quadtree.add);
    quadtree.setLabels();
    quadtreetree.update(quadtree);
  },
  4000);

  return {
    quadtreetree: quadtreetree,
    quadtree: quadtree
  };
}

var theExhibit = exhibitController();
