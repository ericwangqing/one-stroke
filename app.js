import {Edge, Graph, Vertex} from "./graph";


const restartDrawingBtn = document.getElementById('restartDrawing');
const restartGraphBtn = document.getElementById('restartGraph');

// 具体实现游戏逻辑，例如添加顶点、边、检测点击位置等
// ... 其他代码 ...

class App {
  constructor() {
    this.description = document.getElementById('description')
    this.canvas = document.getElementById('drawingArea');
    this.ctx = this.canvas.getContext('2d');

    this.graph = new Graph(this.canvas, this.ctx);
    this.edgeVertices = [];

    this.isDrawingMode = false;
    this.currentVertex = null;
    this.visitedEdges = [];

    this.stepsContainer = document.getElementById('stepsContainer');
    this.init();
  }

  get vertexCounter() {
    return this.graph.vertices.length;
  }

  get edgeCounter() {
    return this.graph.edges.length;
  }

  get currentEdge() {
    return this.visitedEdges.slice(-1)[0];
  }

  init() {
    this.canvas.addEventListener('click', (event) => {
      event.stopPropagation()
      this.handleCanvasClick(event)
    });

    // make the cursor into a delete icon when
    this.canvas.addEventListener('keydown', (event) => {
      event.altKey && (this.canvas.style.cursor = 'not-allowed')
    })
    this.canvas.addEventListener('keyup', (event) => {
      !event.altKey && (this.canvas.style.cursor = 'auto')
    })

    document.addEventListener('click', (event) => {
      this.canvas.style.cursor = 'auto'
      this.edgeVertices = []
    }) // in case user click one vertex, and then click on outside

    this.updateDescription()
  }

  handleCanvasClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (this.isDrawingMode) {
      this.drawOneStroke(x, y);
      this.updateDescription();
    } else if (event.altKey) {
      // this.canvas.style.cursor = 'not-allowed'
      this.deleteFromGraph(x, y);
    } else {
      this.drawGraph(x, y)
    }
  }

  deleteFromGraph(x, y) {
    // 检查是否点击了顶点
    const clickedVertex = this.findVertex(x, y)
    if (clickedVertex) {
      this.graph.edges = this.graph.edges.filter((edge) => {
        return edge.vertex1 !== clickedVertex && edge.vertex2 !== clickedVertex;
      });
      this.graph.vertices = this.graph.vertices.filter((vertex) => vertex !== clickedVertex);
      this.graph.draw();
    } else {
      // 检查是否点击了边
      const clickedEdge = this.findEdge(x, y);
      if (clickedEdge) {
        this.graph.edges = this.graph.edges.filter((edge) => edge !== clickedEdge)
        this.graph.vertices = this.graph.vertices.filter((vertex) => {
          return this.graph.edges.some((edge) => edge.vertex1 === vertex || edge.vertex2 === vertex);
        })
        this.graph.draw();
      }
    }
  }


  drawGraph(x, y) {
    const clickedVertex = this.findVertex(x, y);
    if (clickedVertex) {
      this.addEdge(clickedVertex);
    } else {
      this.addVertex(x, y);
    }
  }

  drawOneStroke(x, y) {
    if (!this.currentVertex) { // 开画时，先点击开始顶点
      this.currentVertex = this.findVertex(x, y);
      this.logStep(true);
    } else {
      const clickedEdge = this.findEdge(x, y);
      if (clickedEdge) {
        this.handleEdgeClick(clickedEdge);
      }
    }
    this.drawCurrentVertexAndPossibleEdges();
  }

  logStep(begin = false, msg = '') {
    const step = document.createElement('li');
    step.innerHTML = msg || (begin ? `出发：${this.currentVertex.name}` :
      this.currentEdge.vertex1 === this.currentVertex ? `${this.currentEdge.vertex2.name} → ${this.currentVertex.name}` :
        `${this.currentEdge.vertex1.name} → ${this.currentVertex.name}`);
    this.stepsContainer.appendChild(step);
  }

  findVertex(x, y) {
    return this.graph.vertices.find(vertex => Math.sqrt(Math.pow(vertex.x - x, 2) + Math.pow(vertex.y - y, 2)) < 10);
  }

  addEdge(clickedVertex) {
    if (this.edgeVertices.length === 0) {
      this.edgeVertices.push(clickedVertex)
      this.canvas.style.cursor = 'move'
    } else if (this.edgeVertices.length === 1) {
      const vertex1 = this.edgeVertices[0]
      const vertex2 = clickedVertex
      if (vertex1 !== vertex2) {
        this._addEdge(vertex1, vertex2)
        this.edgeVertices = []
        this.canvas.style.cursor = 'auto'
      }
    }
  }

  addVertex(x, y) {
    this.edgeVertices = [] // in case select a vertex for an edge, and then click on space rather than another vertex
    if (this.vertexCounter >= 26) {
      alert('顶点数量已达上限(26)');
      return;
    }
    const vertexName = this.getVertexName();
    const vertex = new Vertex(x, y, vertexName, this.ctx);
    this.graph.addVertex(vertex);
    vertex.draw();
  }

  /**
   * find the first unused letter from A ... Z as name
   * a vertex may be deleted, therefore new vertex should take this 'hole letter' as its name
   */
  getVertexName() {
    const vertexNames = this.graph.vertices.map(({name}) => name)
    let i  = 0, name = null
    for (; i <= this.vertexCounter; i++) {
      name = String.fromCharCode(65 + i)
      if (!vertexNames.includes(name)) break
    }
    return name;
  }

  _addEdge(vertex1, vertex2) {
    if (this.edgeCounter >= 100) {
      alert('边数量已达上限(100)');
      return;
    }

    const existingEdges = this.graph.edges.filter(edge => (
      (edge.vertex1 === vertex1 && edge.vertex2 === vertex2) ||
      (edge.vertex1 === vertex2 && edge.vertex2 === vertex1)
    ));
    const edgeCount = existingEdges.length;
    const scale = 40
    const curveFactor = this.getCurveFactor(edgeCount, scale);

    // const curveFactor = 40 * (1 + 2 * (existingEdges.length % 2) - 1);

    const edge = new Edge(vertex1, vertex2, this.getEdgeName(), curveFactor, this.ctx);
    this.graph.addEdge(edge);
    edge.draw();
  }

  /**
   * find the first unused number from 1 ... 100 as name
   * an Edge may be deleted, therefore new Edge should take this 'hole number' as its name
   */
  getEdgeName() {
    const edgeNames = this.graph.edges.map(({name}) => name)
    let name  = 0
    for (; name <= this.edgeCounter; name++) {
      if (!edgeNames.includes(name)) break
    }
    return name;
  }

  /**
   * curveFactor is scale multiply a sequence like 0, 1, -1, 2, -2, 3, -3, ...
   * that make curves layout at both sides of the edge line
   */
  getCurveFactor(edgeCount, scale) {
    // halfCurveCount is the number of curves at one side of the edge line: 1, 1, 2, 2, 3, 3, ...
    const halfCurveCount = edgeCount % 2 === 0 ? edgeCount / 2 : (edgeCount + 1) / 2;
    // make it into a sequence like                                         0, 1, 1, 2, 2, 3, 3 ...
    const factor = edgeCount === 0 ? 0 : edgeCount % 2 === 0 ? -halfCurveCount : halfCurveCount;
    return scale * factor;
  }

// 其他方法，例如实现一笔画功能
  startDrawing() {
    this.isDrawingMode = true;
    this.updateDescription();
  }

  restartDrawing() {
    this.currentVertex = null;
    this.visitedEdges = [];
    this.graph.draw();
    this.isDrawingMode = true;
    this.updateDescription();
    this.logStep(false, '--- 重新开始 ---');
  }


  findEdge(x, y) {
    const dists = this.graph.edges.map(edge => edge.pointToEdgeDistance(x, y)
    )
    const minDist = Math.min(...dists)
    return minDist < 5 ? this.graph.edges[dists.indexOf(minDist)] : null;
  }

  handleEdgeClick(clickedEdge) {
    if (!this.visitedEdges.includes(clickedEdge)) {
      const {vertex1, vertex2} = clickedEdge;
      if (this.currentVertex === vertex1 || this.currentVertex === vertex2) {
        this.visitEdge(clickedEdge);
        this.currentVertex = this.currentVertex === vertex1 ? vertex2 : vertex1;
        this.logStep();

        setTimeout(_ => { // wait a moment to show the last edge
          if (this.isDrawingFinished()) {
            alert('恭喜！你成功完成了一笔画。');
            this.logStep(false, '--- 成功 ---')
          } else if (this.isDrawingFailed()) {
            alert('无路可走，一笔画失败。');
            this.logStep(false, '--- 失败 ---')
          }
        }, 300)
      }
    }
  }

  visitEdge(edge) {
    this.visitedEdges.push(edge);
    edge.draw('blue');
  }

  drawCurrentVertexAndPossibleEdges() {
    this.graph.vertices.forEach(vertex => {
      vertex === this.currentVertex ? vertex.draw('black') : vertex.draw('lightgray')
    })

    this.graph.edges.forEach(edge => {
      if (!this.visitedEdges.includes(edge)) {
        this.canVisit(edge) ? edge.draw('black') : edge.draw('lightgray');
      }
    })
  }

  isDrawingFinished() {
    return this.visitedEdges.length === this.graph.edges.length;
  }

  isDrawingFailed() {
    return !this.graph.edges.some(edge => {
      return (edge.vertex1 === this.currentVertex || edge.vertex2 === this.currentVertex) && !this.visitedEdges.includes(edge);
    });
  }

  restartGraph() {
    this.graph = new Graph(this.canvas, this.ctx);
    this.edgeVertices = [];
    this.isDrawingMode = false;
    this.currentVertex = null;
    this.visitedEdges = [];
    this.graph.draw();
    this.stepsContainer.innerHTML = '';
    this.updateDescription();
  }

  canVisit(edge) {
    const {vertex1, vertex2} = edge;
    return this.currentVertex === vertex1 || this.currentVertex === vertex2;
  }

  updateDescription() {
    this.description.textContent = this.isDrawingMode ?
      !this.currentVertex ? '选择一笔画的起点' : '选择当前路径' :
      '画图：1. 点击空白创建顶点；2.一次点击两个顶点，创建边；3. 按下Alt键，点击顶点或边，删除'
  }
}

const app = new App();

const startDrawingBtn = document.getElementById('startDrawing');
startDrawingBtn.addEventListener('click', () => {
  app.startDrawing();
});

restartDrawingBtn.addEventListener('click', () => {
  app.restartDrawing();
});

restartGraphBtn.addEventListener('click', () => {
  app.restartGraph();
});
