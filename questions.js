const questions = [
  {
    id: 1,
    topic: "limit",
    difficulty: 1,
    latex: "\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}",
    options: ["0", "2", "4", "undefined"],
    answerIndex: 2
  },
  {
    id: 2,
    topic: "limit",
    difficulty: 1,
    latex: "\\lim_{x \\to 0} \\frac{\\sin x}{x}",
    options: ["0", "1", "∞", "undefined"],
    answerIndex: 1
  },
  {
    id: 3,
    topic: "derivative",
    difficulty: 1,
    latex: "\\frac{d}{dx}(x^3)",
    options: ["x^2", "2x", "3x^2", "3x"],
    answerIndex: 2
  },
  {
    id: 4,
    topic: "derivative",
    difficulty: 1,
    latex: "\\frac{d}{dx}(\\sin x)",
    options: ["cos x", "-cos x", "sin x", "-sin x"],
    answerIndex: 0
  },
  {
    id: 5,
    topic: "derivative",
    difficulty: 2,
    latex: "\\frac{d}{dx}(x^2 \\cdot x^3)",
    options: ["5x^4", "6x^5", "x^5", "5x^3"],
    answerIndex: 0
  },
  {
    id: 6,
    topic: "chain rule",
    difficulty: 2,
    latex: "\\frac{d}{dx}(\\sin(x^2))",
    options: [
      "2x\\cos(x^2)",
      "\\cos(x^2)",
      "2\\cos(x)",
      "x^2\\cos x"
    ],
    answerIndex: 0
  },
  {
    id: 7,
    topic: "chain rule",
    difficulty: 2,
    latex: "\\frac{d}{dx}(e^{2x})",
    options: ["e^{2x}", "2e^{2x}", "e^x", "2x e^x"],
    answerIndex: 1
  },
  {
    id: 8,
    topic: "optimization",
    difficulty: 3,
    latex: "Maximize: f(x)=x(10-x)",
    options: ["x=2", "x=5", "x=10", "x=0"],
    answerIndex: 1
  },
  {
    id: 9,
    topic: "integral",
    difficulty: 2,
    latex: "\\int 2x\\,dx",
    options: ["x^2 + C", "2x + C", "x^2", "x + C"],
    answerIndex: 0
  },
  {
    id: 10,
    topic: "integral",
    difficulty: 2,
    latex: "\\int \\cos x\\,dx",
    options: ["\\sin x", "-\\sin x", "\\cos x", "-\\cos x"],
    answerIndex: 0
  },
  {
    id: 11,
    topic: "derivative",
    difficulty: 2,
    latex: "\\frac{d}{dx}(x^2 \\sin x)",
    options: [
      "2x\\sin x + x^2\\cos x",
      "2x\\cos x",
      "x^2\\cos x",
      "2x\\sin x"
    ],
    answerIndex: 0
  },
  {
    id: 12,
    topic: "limit",
    difficulty: 2,
    latex: "\\lim_{x \\to \\infty} \\frac{1}{x}",
    options: ["1", "0", "∞", "undefined"],
    answerIndex: 1
  }
];