function minimizeDFA(states, startState, acceptStates, transitions) {
  // Формируем переходы в виде таблицы
  const tTable = states.reduce((acc, state) => {
    acc[state] = { 0: null, 1: null };
    return acc;
  }, {});

  transitions.forEach(([from, to, symbol]) => {
    tTable[from][symbol] = to;
  });

  // Выделяем классы P и W
  let P = new Set([
    new Set(acceptStates),
    new Set(states.filter((x) => !acceptStates.includes(x))),
  ]);
  let W = new Set([...P]);

  // Функция для разделения класса состояний
  function split(classToSplit, P) {
    const partitions = new Map();
    classToSplit.forEach((state) => {
      const key = JSON.stringify(
        ["0", "1"].map((sym) =>
          [...P].find((part) => part.has(tTable[state][sym]))
        )
      );
      if (!partitions.has(key)) {
        partitions.set(key, new Set());
      }
      partitions.get(key).add(state);
    });
    return partitions;
  }

  while (W.size) {
    const A = [...W][0];
    W.delete(A);

    ["0", "1"].forEach((symbol) => {
      const X = new Set();
      A.forEach((a) => {
        states.forEach((state) => {
          if (tTable[state][symbol] === a) {
            X.add(state);
          }
        });
      });

      for (const Y of P) {
        const intersection = new Set([...X].filter((x) => Y.has(x)));
        if (intersection.size && intersection.size < Y.size) {
          P.delete(Y);
          P.add(intersection);
          P.add(new Set([...Y].filter((x) => !intersection.has(x))));

          if (W.has(Y)) {
            W.delete(Y);
            W.add(intersection);
            W.add(new Set([...Y].filter((x) => !intersection.has(x))));
          } else {
            if (intersection.size <= Y.size - intersection.size) {
              W.add(intersection);
            } else {
              W.add(new Set([...Y].filter((x) => !intersection.has(x))));
            }
          }
        }
      }
    });
  }
  const minimizedTransitions = [];

  // Новые состояния и транзиции
  const minimizedStates = [...P].map((eqClass) => {
    const representative = [...eqClass][0];
    return {
      originalStates: eqClass,
      name: representative, // Мы выбираем одно из состояний класса эквивалентности как "представителя"
    };
  });

  minimizedStates.forEach((stateObj) => {
    const representative = stateObj.name;
    ["0", "1"].forEach((symbol) => {
      const trans = tTable[representative][symbol];
      if (trans !== null) {
        const toStateObj = minimizedStates.find((so) =>
          so.originalStates.has(trans)
        );
        if (toStateObj) {
          const toState = toStateObj.name;
          minimizedTransitions.push([representative, toState, symbol]);
        }
      }
    });
  });

  const minimizedStartState = minimizedStates.find((so) =>
    so.originalStates.has(startState)
  ).name;
  const minimizedAcceptStates = minimizedStates
    .filter((so) =>
      [...so.originalStates].some((s) => acceptStates.includes(s))
    )
    .map((so) => so.name);

  return { minimizedStartState, minimizedAcceptStates, minimizedTransitions };
}

function generateMermaidFlowchart(
  minimizedStartState,
  minimizedAcceptStates,
  minimizedTransitions
) {
  let mermaidString = "flowchart TD\n";

  // Состояния принятия
  minimizedAcceptStates.forEach((acceptState) => {
    mermaidString += `${acceptState}(("${acceptState}"))\n`;
  });

  // Обычные состояния и переходы
  minimizedTransitions.forEach(([from, to, symbol]) => {
    // Если состояние является принимающим, используем двойной круг
    if (minimizedAcceptStates.includes(from)) {
      mermaidString += `${from}(("${from}")) --> |"${symbol}"| ${to}\n`;
    } else {
      mermaidString += `${from} --> |"${symbol}"| ${to}\n`;
    }
  });
  mermaidString = mermaidString.replaceAll(
    minimizedAcceptStates[0].toString(),
    "#"
  );
  mermaidString += '#(("#")) --> |"EOL"| 0\n';
  return mermaidString;
}

function countUnique(iterable) {
  console.log(typeof iterable);
  console.log("counting", iterable);
  return new Set(iterable).size;
}

function buildTransitionTable(
  _states,
  startState,
  acceptStates,
  transitions,
  ddid,
  det = true
) {
  let states = _states.sort();
  console.log("Building table from trans", transitions);
  // Находим элемент div, в который будет помещена таблица
  const tableDiv = document.getElementById(ddid);
  tableDiv.innerHTML = "";
  // Создаем таблицу
  const table = document.createElement("table");
  table.border = 1; // Добавляем границы для наглядности

  // Добавляем заголовок таблицы
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const headerCellsText = ["State", "1", "0", "EOL"];
  headerCellsText.forEach((text) => {
    const headerCell = document.createElement("th");
    headerCell.textContent = text;
    headerRow.appendChild(headerCell);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Создаем основную часть таблицы
  const tbody = document.createElement("tbody");

  states.forEach((state) => {
    const row = document.createElement("tr");

    // Ячейка с состоянием
    const stateCell = document.createElement("td");
    stateCell.textContent = `S${state == acceptStates[0] ? "#" : state}`;
    row.appendChild(stateCell);

    // Ячейки для '1', '0' и 'EOL'
    ["1", "0", "EOL"].forEach((symbol) => {
      const cell = document.createElement("td");
      ww = [];
      for (let i = 0; i < transitions.length; i++) {
        if (transitions[i][0] == state && transitions[i][2] == symbol)
          ww.push(transitions[i][1]);
      }
      if (ww.length) {
        ww = ww.map((a) => (a == acceptStates[0] ? "#" : a));
        if (det) cell.textContent = `S${ww[0]}`;
        else cell.textContent = `{S${ww.join(", S")}}`;
      } else cell.textContent = "";
      if (state == acceptStates[0] && symbol == "EOL")
        cell.textContent = det ? "S0" : "{S0}";
      row.appendChild(cell);
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  tableDiv.appendChild(table);
}

function buildSukaTable(_states, startState, acceptStates, transitions, ddid) {
  states = _states.sort();
  console.log("Building table from trans", transitions);
  // Находим элемент div, в который будет помещена таблица
  const tableDiv = document.getElementById(ddid);
  tableDiv.innerHTML = "";
  // Создаем таблицу
  const table = document.createElement("table");
  table.border = 1; // Добавляем границы для наглядности

  // Добавляем заголовок таблицы
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const headerCellsText = ["State", ...states];
  headerCellsText.forEach((text) => {
    const headerCell = document.createElement("th");
    headerCell.textContent = `S${text == acceptStates[0] ? "#" : text}`;
    headerRow.appendChild(headerCell);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Создаем основную часть таблицы
  const tbody = document.createElement("tbody");

  states.forEach((state1) => {
    const row = document.createElement("tr");

    // Ячейка с состоянием
    const stateCell = document.createElement("td");
    stateCell.textContent = `S${state1 == acceptStates[0] ? "#" : state1}`;
    row.appendChild(stateCell);

    // Ячейки для '1', '0' и 'EOL'
    states.forEach((state2) => {
      const cell = document.createElement("td");
      let found = null;
      for (let j = 0; j < transitions.length; j++) {
        if (transitions[j][0] == state1 && transitions[j][1] == state2)
          found = transitions[j][2];
      }
      cell.textContent = found ?? "";
      if (state1 == acceptStates[0] && state2 == 0) cell.textContent = "EOL";
      row.appendChild(cell);
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  tableDiv.appendChild(table);
}

var vue = new Vue({
  el: "#app",
  data: {
    p1: 1,
    q1: 1,
    p2: 1,
    q2: 1,
    p3: 1,
    q3: 1,
    sww: 1,
    made: false,
    dstates: 0,
    nstates: 0,
  },
  methods: {
    sss: function () {
      console.log("dddd");
      if (this.sww) this.sww = 0;
      else this.sww = 1;
    },
    calcNfa: async function () {
      let I = 1,
        O = 1;
      if (!this.sww) {
        I = "1";
        O = "0";
      } else {
        I = "0";
        O = "1";
      }
      const p1 = parseInt(this.p1),
        q1 = parseInt(this.q1),
        p2 = parseInt(this.p2),
        q2 = parseInt(this.q2),
        p3 = parseInt(this.p3),
        q3 = parseInt(this.q3);

      let automaton = [];
      let lastNumber = 0;
      let retState = 0;
      let redHead = false;
      let cycleCand = [];
      if (!redHead) cycleCand.push(retState);
      for (let i = 0; i < p1 + q1; i++) {
        automaton.push([retState + i, retState + i + 1, I]);
        lastNumber++;
        if (cycleCand.length < p1) cycleCand.push(retState + i + 1);
      }
      redHead = false;
      if (cycleCand[cycleCand.length - 1] == lastNumber) redHead = true;
      retState = lastNumber;
      while (cycleCand.length < p1) {
        automaton.push([cycleCand[cycleCand.length - 1], ++lastNumber, I]);
        cycleCand.push(lastNumber);
      }
      automaton.push([cycleCand[cycleCand.length - 1], cycleCand[0], I]);

      console.log("cyclecand", cycleCand);
      cycleCand = [];
      if (!redHead) cycleCand.push(retState);
      automaton.push([retState, ++lastNumber, O]);
      if (cycleCand.length < p2) cycleCand.push(lastNumber);
      let lln = lastNumber;
      for (let i = 0; i < p2 + q2 - 1; i++) {
        automaton.push([lln + i, lln + i + 1, O]);
        lastNumber++;
        if (cycleCand.length < p2) cycleCand.push(lln + i + 1);
      }
      redHead = false;
      if (cycleCand[cycleCand.length - 1] == lastNumber) redHead = true;
      retState = lastNumber;
      while (cycleCand.length < p2) {
        automaton.push([cycleCand[cycleCand.length - 1], ++lastNumber, O]);
        cycleCand.push(lastNumber);
      }
      automaton.push([cycleCand[cycleCand.length - 1], cycleCand[0], O]);

      console.log(cycleCand);
      cycleCand = [];
      if (!redHead) cycleCand.push(retState);
      automaton.push([retState, ++lastNumber, I]);
      if (cycleCand.length < p3) cycleCand.push(lastNumber);
      lln = lastNumber;
      for (let i = 0; i < p3 + q3 - 1; i++) {
        automaton.push([lln + i, lln + i + 1, I]);
        lastNumber++;
        if (cycleCand.length < p3) cycleCand.push(lln + i + 1);
      }
      retState = lastNumber;
      while (cycleCand.length < p3) {
        automaton.push([cycleCand[cycleCand.length - 1], ++lastNumber, I]);
        cycleCand.push(lastNumber);
      }
      automaton.push([cycleCand[cycleCand.length - 1], cycleCand[0], I]);

      console.log(cycleCand);

      console.log("automat", automaton);
      this.nstates = lastNumber + 1;
      let flowchart = generateMermaidFlowchart(0, [retState], automaton);
      const output = document.querySelector("#mermaid2");
      if (output.firstChild !== null) {
        output.innerHTML = "";
      }
      let insert = function (code) {
        output.innerHTML = code.svg;
      };
      let states = [];
      for (let i = 0; i < lastNumber + 1; i++) {
        states.push(lastNumber - i);
      }
      insert(await mermaid.render("preparedScheme", flowchart));
      buildTransitionTable(states, 0, [retState], automaton, "table21", false);
      buildSukaTable(states, 0, [retState], automaton, "table22");
    },
    calc: async function () {
      // Определение параметров
      let I = 1,
        O = 1;
      if (!this.sww) {
        I = "1";
        O = "0";
      } else {
        I = "0";
        O = "1";
      }
      const p1 = parseInt(this.p1),
        q1 = parseInt(this.q1),
        p2 = parseInt(this.p2),
        q2 = parseInt(this.q2),
        p3 = parseInt(this.p3),
        q3 = parseInt(this.q3);
      let automaton = [];
      let lastNumber = 0;
      for (let i = 0; i < p1 + q1; i++)
        automaton.push([lastNumber, ++lastNumber, I]);

      let returnState = lastNumber;
      for (let i = 0; i < p1 - 1; i++)
        automaton.push([lastNumber, ++lastNumber, I]);

      automaton.push([lastNumber, returnState, I]);

      automaton.push([returnState, ++lastNumber, O]);
      for (let i = 0; i < p2 + q2 - 1; i++)
        automaton.push([lastNumber, ++lastNumber, O]);
      returnState = lastNumber;
      for (let i = 0; i < p2 - 1; i++)
        automaton.push([lastNumber, ++lastNumber, O]);
      automaton.push([lastNumber, returnState, O]);

      automaton.push([returnState, ++lastNumber, I]);
      for (let i = 0; i < p3 + q3 - 1; i++)
        automaton.push([lastNumber, ++lastNumber, I]);
      returnState = lastNumber;
      for (let i = 0; i < p3 - 1; i++)
        automaton.push([lastNumber, ++lastNumber, I]);
      automaton.push([lastNumber, returnState, I]);

      let states = [];
      for (let i = 0; i <= lastNumber; i++) states.push(i);

      let { minimizedAcceptStates, minimizedStartState, minimizedTransitions } =
        minimizeDFA(states, 0, [returnState], automaton);

      let flowchart = generateMermaidFlowchart(
        minimizedStartState,
        minimizedAcceptStates,
        minimizedTransitions
      );
      this.dstates = countUnique([
        ...minimizedTransitions.map((q) => q[0]),
        ...minimizedTransitions.map((q) => q[1]),
      ]);
      this.made = true;
      const output = document.querySelector("#mermaid1");
      if (output.firstChild !== null) {
        output.innerHTML = "";
      }
      let insert = function (code) {
        output.innerHTML = code.svg;
      };
      insert(await mermaid.render("preparedddd", flowchart));
      buildTransitionTable(
        Array(
          ...new Set([
            ...minimizedTransitions.map((q) => q[0]),
            ...minimizedTransitions.map((q) => q[1]),
          ])
        ),
        0,
        minimizedAcceptStates,
        minimizedTransitions,
        "table11"
      );
      buildSukaTable(
        Array(
          ...new Set([
            ...minimizedTransitions.map((q) => q[0]),
            ...minimizedTransitions.map((q) => q[1]),
          ])
        ),
        0,
        minimizedAcceptStates,
        minimizedTransitions,
        "table12"
      );
      await this.calcNfa();
    },
  },
});
