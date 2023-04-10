const canvas = document.getElementById('drawingArea');
const ctx = canvas.getContext('2d');
const restartDrawingBtn = document.getElementById('restartDrawing');
const restartGraphBtn = document.getElementById('restartGraph');

class Graph {
  constructor() {
    this.vertices = [];
    this.edges = [];
  }

  addVertex(vertex) {
    this.vertices.push(vertex);
  }

  addEdge(edge) {
    this.edges.push(edge);
  }

  // 其他方法
}

class Vertex {
  constructor(x, y, name) {
    this.x = x;
    this.y = y;
    this.name = name;
  }

  draw(fillStyle = 'black') {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.closePath();

    ctx.font = "14px Arial";
    ctx.fillStyle = fillStyle;
    ctx.fillText(this.name, this.x - 5, this.y - 10);
  }
}

class Edge {
  constructor(vertex1, vertex2, name) {
    this.vertex1 = vertex1;
    this.vertex2 = vertex2;
    this.name = name;
  }

  draw(strokeStyle = 'black') {
    ctx.beginPath();
    ctx.moveTo(this.vertex1.x, this.vertex1.y);
    ctx.lineTo(this.vertex2.x, this.vertex2.y);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    const midX = (this.vertex1.x + this.vertex2.x) / 2;
    const midY = (this.vertex1.y + this.vertex2.y) / 2;

    ctx.font = "14px Arial";
    ctx.fillStyle = strokeStyle;
    ctx.fillText(this.name, midX - 20, midY);
  }
}

// 具体实现游戏逻辑，例如添加顶点、边、检测点击位置等
// ... 其他代码 ...

class App {
  constructor() {
    this.graph = new Graph();
    this.selectedVertices = [];

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
    canvas.addEventListener('click', (event) => this.handleCanvasClick(event));
  }

  handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (this.isDrawingMode) {
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
    } else {
      const clickedVertex = this.findVertex(x, y);

      if (clickedVertex) {
        this.handleVertexClick(clickedVertex);
      } else {
        this.addVertex(x, y);
      }
    }
  }

  logStep(begin=false, msg='') {
    const step = document.createElement('li');
    step.innerHTML = msg || (begin ?  `出发：${this.currentVertex.name}` :
      this.currentEdge.vertex1 === this.currentVertex ? `${this.currentEdge.vertex2.name} → ${this.currentVertex.name}` :
      `${this.currentEdge.vertex1.name} → ${this.currentVertex.name}`);
    this.stepsContainer.appendChild(step);
  }

  findVertex(x, y) {
    return this.graph.vertices.find(vertex => Math.sqrt(Math.pow(vertex.x - x, 2) + Math.pow(vertex.y - y, 2)) < 10);
  }

  handleVertexClick(clickedVertex) {
    if (this.selectedVertices.length === 0) {
      this.selectedVertices.push(clickedVertex);
    } else if (this.selectedVertices.length === 1) {
      const vertex1 = this.selectedVertices[0];
      const vertex2 = clickedVertex;

      if (vertex1 !== vertex2) {
        this.addEdge(vertex1, vertex2);
        this.selectedVertices = [];
      }
    }
  }

  addVertex(x, y) {
    if (this.vertexCounter >= 26) {
      alert('顶点数量已达上限(26)');
      return;
    }
    const vertexName = String.fromCharCode(65 + this.vertexCounter); // 65 is ASCII code of 'A'
    const vertex = new Vertex(x, y, vertexName);
    this.graph.addVertex(vertex);
    vertex.draw();
  }

  addEdge(vertex1, vertex2) {
    if (this.edgeCounter >= 100) {
      alert('边数量已达上限(100)');
      return;
    }
    const edge = new Edge(vertex1, vertex2, this.edgeCounter + 1);
    this.graph.addEdge(edge);
    edge.draw();
  }

  // 其他方法，例如实现一笔画功能
  startDrawing() {
    this.isDrawingMode = true;
  }

  restartDrawing() {
    this.currentVertex = null;
    this.visitedEdges = [];
    this.redraw();
    this.isDrawingMode = true;
    this.logStep(false, '--- 重新开始 ---');
  }

  redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.graph.vertices.forEach(vertex => vertex.draw());
    this.graph.edges.forEach(edge => edge.draw())
  }

  findEdge(x, y) {
    const dists = this.graph.edges.map(edge =>
      this.pointToLineDistance(x, y, edge.vertex1.x, edge.vertex1.y, edge.vertex2.x, edge.vertex2.y)
    )
    const minDist = Math.min(...dists)
    return minDist < 5 ? this.graph.edges[dists.indexOf(minDist)] : null;
  }

  pointToLineDistance(x, y, x1, y1, x2, y2) {
    const A = y2 - y1;
    const B = x1 - x2;
    const C = x2 * y1 - x1 * y2;
    return Math.abs(A * x + B * y + C) / Math.sqrt(Math.pow(A, 2) + Math.pow(B, 2));
  }

  handleEdgeClick(clickedEdge) {
    if (!this.visitedEdges.includes(clickedEdge)) {
      const { vertex1, vertex2 } = clickedEdge;
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
    // redraw all non-visited edges, possible edges with black color, other impossible edges with gray color
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
    this.graph = new Graph();
    this.selectedVertices = [];
    this.isDrawingMode = false;
    this.currentVertex = null;
    this.visitedEdges = [];
    this.redraw();
    this.stepsContainer.innerHTML = '';
  }

  canVisit(edge) {
    const { vertex1, vertex2 } = edge;
    return this.currentVertex === vertex1 || this.currentVertex === vertex2;
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
