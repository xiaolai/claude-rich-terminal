// node_modules/@zombie-mermaid/core/dist/index.js
function e(e2, t2) {
  let n2 = e2.match(/^click\s+([\w\p{L}-]+)\s+(.*)$/iu);
  if (!n2) return;
  let r = n2[1], i = n2[2].trim(), a2 = { ...t2.get(r) }, o = i.match(/^(?:call|callback)\s+(.+?)\s*$/i);
  if (o) {
    let e3 = o[1].match(/^(.*?\))\s+"([^"]*)"\s*$/);
    e3 ? (a2.callback = e3[1].trim(), a2.tooltip = e3[2]) : a2.callback = o[1].trim(), t2.set(r, a2);
    return;
  }
  i = i.replace(/^href\s+/i, "");
  let s = [...i.matchAll(/"([^"]*)"/g)].map((e3) => e3[1]);
  s.length > 0 && (a2.href = s[0]), s.length > 1 && (a2.tooltip = s[1]);
  let c = i.match(/(_blank|_self|_parent|_top)\s*$/i);
  c && (a2.target = c[1].toLowerCase()), (a2.href !== void 0 || a2.tooltip !== void 0) && t2.set(r, a2);
}
function t(e2) {
  if (!e2 || /[\x00-\x1F\x7F]/.test(e2)) return;
  let t2 = e2.trim();
  if (/^[./#?]/.test(t2)) return t2;
  let n2 = t2.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/)?.[1];
  return n2 === void 0 || /^(https?|mailto)$/i.test(n2) ? t2 : void 0;
}
var n = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
function a(e2) {
  let t2 = n.exec(e2.trim());
  if (!t2) return null;
  let r = t2[1];
  if (r === void 0) return null;
  let i = r;
  return (i.length === 3 || i.length === 4) && (i = i.split("").map((e3) => e3 + e3).join("")), {
    r: parseInt(i.slice(0, 2), 16),
    g: parseInt(i.slice(2, 4), 16),
    b: parseInt(i.slice(4, 6), 16),
    a: i.length === 8 ? parseInt(i.slice(6, 8), 16) / 255 : 1
  };
}
var p = /^[&#](?:#?[0-9]+|#?[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/;
var m = /* @__PURE__ */ new Set(["&", "#"]);
function ee(e2) {
  let t2 = null;
  for (let n2 = 0; n2 < e2.length; n2++) {
    let r = e2[n2];
    if (t2 !== null) {
      r === t2 && (t2 = null);
      continue;
    }
    if (r === '"' || r === "'") {
      t2 = r;
      continue;
    }
    if (m.has(r)) {
      let t3 = p.exec(e2.slice(n2));
      if (t3) {
        n2 += t3[0].length - 1;
        continue;
      }
    }
    if (r === "%" && e2[n2 + 1] === "%") return n2;
  }
  return -1;
}
function h(e2) {
  let t2 = [], n2 = "", r = null;
  for (let i = 0; i < e2.length; i++) {
    let a2 = e2[i];
    if (r !== null) {
      n2 += a2, a2 === r && (r = null);
      continue;
    }
    if (a2 === '"' || a2 === "'") {
      r = a2, n2 += a2;
      continue;
    }
    if (m.has(a2)) {
      let t3 = p.exec(e2.slice(i));
      if (t3) {
        n2 += t3[0], i += t3[0].length - 1;
        continue;
      }
    }
    if (a2 === ";") {
      t2.push(n2), n2 = "";
      continue;
    }
    n2 += a2;
  }
  return t2.push(n2), t2;
}
function g(e2) {
  let t2 = [], n2 = e2.split("\n");
  for (let e3 = 0; e3 < n2.length; e3++) {
    let r = n2[e3].trim(), i = e3 + 1, a2 = ee(r);
    if (a2 !== -1 && (r = r.slice(0, a2).trim()), r.length === 0) continue;
    let o = [];
    for (let e4 of h(r)) {
      let t3 = e4.trim();
      t3.length !== 0 && o.push({
        text: t3,
        line: i
      });
    }
    o.length > 0 && t2.push(o);
  }
  return t2;
}
function _(e2) {
  return g(e2).flat();
}
function te(e2) {
  let t2 = _(e2)[0]?.text.toLowerCase() ?? "";
  return /^xychart(?:-beta)?(?:\s|$)/.test(t2) ? "xychart" : /^architecture(?:-beta)?\s*$/.test(t2) ? "architecture" : /^c4(?:context|container|component|dynamic|deployment)\s*$/.test(t2) ? "c4" : /^sequencediagram\s*$/.test(t2) ? "sequence" : /^classdiagram\s*$/.test(t2) ? "class" : /^erdiagram\s*$/.test(t2) ? "er" : "flowchart";
}
function y(e2) {
  return e2 === "TD" || e2 === "TB" || e2 === "LR" || e2 === "BT" || e2 === "RL";
}
function ne(e2) {
  let t2 = e2?.toUpperCase();
  if (t2 === void 0 || !y(t2)) throw Error(`Invalid direction: "${e2}"`);
  return t2;
}
function b(e2, t2) {
  return t2 === void 0 || !y(t2) ? e2 : {
    ...e2,
    direction: t2
  };
}
var x = /* @__PURE__ */ new Set([
  "linear",
  "basis",
  "natural",
  "step",
  "stepBefore",
  "stepAfter"
]);
var S = {
  theme: "colors come from the caller's bg/fg render options, which are usually CSS variables so a diagram inherits the host page's light/dark. A diagram-supplied theme would hard-code colors that fight it. Mermaid's theme names (default/dark/forest/neutral) also have no equivalent in this renderer's palettes \u2014 pass `bg`/`fg`, or a THEMES entry, instead",
  securitylevel: "this renderer emits static SVG and never executes diagram-supplied script, so there is no sandbox to configure",
  defaultrenderer: "ELK is the only layout engine; dagre/elk selection has no effect",
  fontfamily: "use the `font` render option instead",
  htmllabels: "labels are always rendered as SVG text; there is no HTML label mode",
  maxtextsize: "no text-size limit is enforced",
  startonload: "not a browser auto-render integration"
};
var C = /^\s*%%\{\s*(?:init|initialize)\s*:\s*([\s\S]*?)\}%%/i;
function re(e2) {
  let t2 = "", n2 = null;
  for (let r = 0; r < e2.length; r++) {
    let i = e2[r];
    if (n2 !== null) {
      if (i === "\\" && r + 1 < e2.length) {
        let n3 = e2[r + 1];
        t2 += n3 === "'" ? "'" : `\\${n3}`, r++;
      } else i === n2 ? (n2 = null, t2 += '"') : t2 += i === '"' ? '\\"' : i;
      continue;
    }
    if (i === '"' || i === "'") {
      n2 = i, t2 += '"';
      continue;
    }
    if (/[A-Za-z_$]/.test(i)) {
      let n3 = r;
      for (; n3 < e2.length && /[\w$-]/.test(e2[n3]); ) n3++;
      let i2 = e2.slice(r, n3), a2 = n3;
      for (; a2 < e2.length && /\s/.test(e2[a2]); ) a2++;
      if (e2[a2] === ":") {
        t2 += `"${i2}"`, r = n3 - 1;
        continue;
      }
      t2 += /^(true|false|null)$/i.test(i2) ? i2.toLowerCase() : `"${i2}"`, r = n3 - 1;
      continue;
    }
    t2 += i;
  }
  return t2;
}
function T(e2) {
  let t2 = e2.match(C);
  if (!t2) return;
  let n2;
  try {
    n2 = JSON.parse(re(t2[1]));
  } catch {
    return;
  }
  if (typeof n2 != "object" || !n2) return;
  let r = { ignored: [] }, i = { ...n2 };
  for (let [e3, t3] of Object.entries(i)) {
    let n3 = e3.toLowerCase();
    if (n3 === "theme" && typeof t3 == "string") {
      r.theme = t3, r.ignored.push(e3);
      continue;
    }
    if (n3 === "flowchart" && typeof t3 == "object" && t3) {
      let e4 = { ...t3 };
      for (let [t4, n4] of Object.entries(e4)) {
        if (t4.toLowerCase() === "curve" && typeof n4 == "string") {
          x.has(n4) && (r.curve = n4);
          continue;
        }
        t4.toLowerCase() in S && r.ignored.push(t4);
      }
      continue;
    }
    n3 in S && r.ignored.push(e3);
  }
  return r;
}
function ie(e2) {
  let t2 = { ignored: [] };
  for (let n2 of e2) {
    let e3 = T(n2);
    e3 && (e3.theme !== void 0 && (t2.theme = e3.theme), e3.curve !== void 0 && (t2.curve = e3.curve), t2.ignored.push(...e3.ignored));
  }
  return t2;
}
function D(e2) {
  return e2 >= 4352 && e2 <= 4447 || e2 >= 11904 && e2 <= 12031 || e2 >= 12032 && e2 <= 12255 || e2 >= 12288 && e2 <= 12351 || e2 >= 12352 && e2 <= 12447 || e2 >= 12448 && e2 <= 12543 || e2 >= 12544 && e2 <= 12591 || e2 >= 12592 && e2 <= 12687 || e2 >= 12688 && e2 <= 12799 || e2 >= 12800 && e2 <= 13311 || e2 >= 13312 && e2 <= 19903 || e2 >= 19968 && e2 <= 40959 || e2 >= 44032 && e2 <= 55215 || e2 >= 63744 && e2 <= 64255 || e2 >= 65280 && e2 <= 65376 || e2 >= 65504 && e2 <= 65510 || e2 >= 131072;
}
var pe = /\p{Emoji_Presentation}/u;
var O = /\p{Extended_Pictographic}/u;
function k(e2) {
  return e2 >= 9632 && e2 <= 9727;
}
function A(e2) {
  return e2 >= 8596 && e2 <= 8601 || e2 === 8617 || e2 === 8618;
}
function j(e2) {
  if (pe.test(e2)) return true;
  let t2 = e2.codePointAt(0);
  return t2 !== void 0 && k(t2) || t2 !== void 0 && A(t2) ? false : O.test(e2);
}
function M(e2) {
  let t2 = e2.codePointAt(0);
  return t2 === void 0 ? false : D(t2) || j(e2);
}
function he(e2) {
  let t2 = e2.startsWith('"') && e2.endsWith('"') ? e2.slice(1, -1) : e2;
  return (t2.length >= 2 && t2.startsWith("`") && t2.endsWith("`") ? t2.slice(1, -1) : t2).replace(/<br\s*\/?>/gi, "\n").replace(/\\n/g, "\n").replace(/<\/?(?:sub|sup|small|mark)\s*>/gi, "").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(?<!\*)\*([^\s*](?:[^*]*[^\s*])?)\*(?!\*)/g, "<i>$1</i>").replace(/~~(.+?)~~/g, "<s>$1</s>");
}
function ge(e2) {
  return e2.replace(/<\/?(?:b|strong|i|em|u|s|del)\s*>/gi, "");
}
function q(e2) {
  let t2 = e2.replace(/;\s*$/, ""), n2 = {};
  for (let e3 of t2.split(",")) {
    let t3 = e3.indexOf(":");
    if (t3 > 0) {
      let r = e3.slice(0, t3).trim(), i = e3.slice(t3 + 1).trim();
      r && i && (n2[r] = i);
    }
  }
  return n2;
}
function be(e2, t2) {
  let n2 = e2.match(/^classDef\s+([\w,-]+)\s+(.+)$/);
  if (!n2) return false;
  let r = q(n2[2]);
  for (let e3 of n2[1].split(",")) {
    let n3 = e3.trim();
    n3 && t2.classDefs.set(n3, r);
  }
  return true;
}
function xe(e2, t2) {
  let n2 = e2.match(/^class\s+([\w-]+(?:\s*,\s*[\w-]+)*)\s+([\w-]+)\s*;?\s*$/);
  if (!n2) return false;
  let r = n2[2];
  for (let e3 of n2[1].split(",")) t2.classAssignments.set(e3.trim(), r);
  return true;
}
function Se(e2, t2) {
  let n2 = e2.match(/^cssClass\s+"([^"]*)"\s+([\w-]+)\s*;?\s*$/);
  if (!n2) return false;
  let r = n2[2];
  for (let e3 of n2[1].split(",")) {
    let n3 = e3.trim();
    n3 && t2.classAssignments.set(n3, r);
  }
  return true;
}
function Ce(e2, t2) {
  let n2 = e2.match(/^style\s+([\w,-]+)\s+(.+)$/);
  if (!n2) return false;
  let r = q(n2[2]);
  for (let e3 of n2[1].split(",").map((e4) => e4.trim())) t2.nodeStyles.set(e3, {
    ...t2.nodeStyles.get(e3),
    ...r
  });
  return true;
}
function we(e2) {
  let t2 = e2.match(/^(.+?):::([\w][\w-]*)$/);
  return t2 ? {
    id: t2[1],
    className: t2[2]
  } : { id: e2 };
}

// node_modules/@zombie-mermaid/mermaid-parser/dist/index.js
var u = String.raw`[\w-]+`;
var d = new RegExp(String.raw`^(group|service)\s+(${u})\s*(?:\(([^)]*)\))?\s*(?:\[([^\]]*)\])?(?:\s+in\s+(${u}))?$`);
var f = new RegExp(String.raw`^junction\s+(${u})(?:\s+in\s+(${u}))?$`);
var p2 = new RegExp(String.raw`^(${u})(\{group\})?:([LRTB])\s+(<)?--(>)?\s+([LRTB]):(${u})(\{group\})?$`);
var m2 = new RegExp(String.raw`^align\s+(?:row|column)\s+${u}(?:\s+${u})+$`);
function h2(e2, t2) {
  throw Error(`Architecture diagram, line ${e2.line}: ${t2} \u2014 "${e2.text}"`);
}
function g2(e2) {
  return e2?.trim().replace(/^"(.*)"$/, "$1") || void 0;
}
function _2(e2) {
  let t2 = {
    groups: [],
    services: [],
    junctions: [],
    edges: []
  }, r = /* @__PURE__ */ new Map(), i = [], a2 = [], o = (e3, t3, n2, a3) => {
    r.has(t3) && h2(e3, `duplicate id "${t3}"`), a3 === t3 && h2(e3, `"${t3}" cannot be inside itself`), r.set(t3, n2), a3 && i.push({
      stmt: e3,
      parent: a3
    });
  };
  for (let r2 = 1; r2 < e2.length; r2++) {
    let i2 = e2[r2], s2 = i2.text, c = s2.match(d);
    if (c) {
      let e3 = c[1], r3 = c[2], a3 = c[4], s3 = c[5];
      o(i2, r3, e3, s3);
      let l2 = {
        id: r3,
        icon: g2(c[3]),
        title: a3 === void 0 ? r3 : he(a3.trim()),
        parent: s3
      };
      e3 === "group" ? t2.groups.push(l2) : t2.services.push(l2);
      continue;
    }
    let l = s2.match(f);
    if (l) {
      let e3 = l[1], n2 = l[2];
      o(i2, e3, "junction", n2), t2.junctions.push({
        id: e3,
        parent: n2
      });
      continue;
    }
    let u3 = s2.match(p2);
    if (u3) {
      a2.push({
        stmt: i2,
        edge: {
          source: u3[1],
          sourceGroup: u3[2] !== void 0,
          sourcePort: u3[3],
          arrowStart: u3[4] !== void 0,
          arrowEnd: u3[5] !== void 0,
          targetPort: u3[6],
          target: u3[7],
          targetGroup: u3[8] !== void 0
        }
      });
      continue;
    }
    m2.test(s2) || h2(i2, "unrecognized statement");
  }
  for (let { stmt: e3, parent: t3 } of i) r.get(t3) !== "group" && h2(e3, `"in ${t3}" must name a declared group`);
  let s = /* @__PURE__ */ new Map();
  for (let e3 of t2.groups) e3.parent && s.set(e3.id, e3.parent);
  for (let e3 of t2.groups) {
    let t3 = /* @__PURE__ */ new Set([e3.id]);
    for (let n2 = s.get(e3.id); n2; n2 = s.get(n2)) {
      if (t3.has(n2)) throw Error(`Architecture diagram: group "${e3.id}" is nested inside itself`);
      t3.add(n2);
    }
  }
  for (let { stmt: e3, edge: n2 } of a2) {
    let i2 = [[n2.source, n2.sourceGroup], [n2.target, n2.targetGroup]];
    for (let [n3, a3] of i2) {
      let i3 = r.get(n3);
      i3 || h2(e3, `unknown id "${n3}"`), i3 === "group" && h2(e3, `edges connect services or junctions, not the group "${n3}"`);
      let o2 = [...t2.services, ...t2.junctions].find((e4) => e4.id === n3)?.parent;
      a3 && !o2 && h2(e3, `"{group}" needs "${n3}" to be declared inside a group`);
    }
    t2.edges.push(n2);
  }
  return t2;
}
var v = {
  database: "cylinder",
  disk: "cylinder",
  cloud: "stadium",
  internet: "circle"
};
var y2 = /* @__PURE__ */ new Set(["L", "R"]);
function b2(e2) {
  let t2 = 0, n2 = 0;
  for (let r of e2) for (let e3 of [r.sourcePort, r.targetPort]) y2.has(e3) ? t2++ : n2++;
  return n2 > t2 ? "TB" : "LR";
}
function x2(e2, t2) {
  let [n2, r] = t2 === "LR" || t2 === "RL" ? ["L", "R"] : ["T", "B"];
  return e2.sourcePort === r || e2.targetPort === n2 ? false : e2.sourcePort === n2 || e2.targetPort === r;
}
function S2(e2) {
  let t2 = /* @__PURE__ */ new Map(), n2 = /* @__PURE__ */ new Map();
  for (let r2 of e2.services) t2.set(r2.id, {
    id: r2.id,
    label: r2.title,
    shape: r2.icon && v[r2.icon] || "rectangle"
  }), n2.set(r2.id, r2.parent);
  for (let r2 of e2.junctions) t2.set(r2.id, {
    id: r2.id,
    label: "",
    shape: "filled-circle"
  }), n2.set(r2.id, r2.parent);
  let r = /* @__PURE__ */ new Map();
  for (let t3 of e2.groups) r.set(t3.id, {
    id: t3.id,
    label: t3.title,
    nodeIds: [],
    children: []
  });
  let i = [];
  for (let t3 of e2.groups) {
    let e3 = r.get(t3.id), n3 = t3.parent ? r.get(t3.parent) : void 0;
    n3 ? n3.children.push(e3) : i.push(e3);
  }
  for (let [e3, t3] of n2) r.get(t3 ?? "")?.nodeIds.push(e3);
  let a2 = b2(e2.edges);
  return {
    direction: a2,
    nodes: t2,
    edges: e2.edges.map((e3) => {
      let t3 = (e4, t4) => (t4 ? n2.get(e4) : void 0) ?? e4, r2 = !x2(e3, a2), [i2, o] = r2 ? [t3(e3.source, e3.sourceGroup), t3(e3.target, e3.targetGroup)] : [t3(e3.target, e3.targetGroup), t3(e3.source, e3.sourceGroup)];
      return {
        source: i2,
        target: o,
        style: "solid",
        hasArrowStart: r2 ? e3.arrowStart : e3.arrowEnd,
        hasArrowEnd: r2 ? e3.arrowEnd : e3.arrowStart
      };
    }),
    subgraphs: i,
    classDefs: /* @__PURE__ */ new Map(),
    classAssignments: /* @__PURE__ */ new Map(),
    nodeStyles: /* @__PURE__ */ new Map(),
    linkStyles: /* @__PURE__ */ new Map(),
    interactions: /* @__PURE__ */ new Map()
  };
}
var C2 = {
  c4context: "context",
  c4container: "container",
  c4component: "component",
  c4dynamic: "dynamic",
  c4deployment: "deployment"
};
var ee2 = /^(?:UpdateElementStyle|UpdateRelStyle|UpdateLayoutConfig|LAYOUT_[A-Z_]+|SHOW_LEGEND|SHOW_FLOATING_LEGEND|AddElementTag|AddRelTag|AddBoundaryTag|RoleTag)\b/;
var te2 = /^(Person|System|Container|Component)(Db|Queue)?(_Ext)?$/;
var ne2 = /^(?:Boundary|Enterprise_Boundary|System_Boundary|Container_Boundary)$/;
var w = /^(?:Deployment_Node|Node|Node_L|Node_R)$/;
var re2 = /^(Rel|BiRel|Rel_U|Rel_Up|Rel_D|Rel_Down|Rel_L|Rel_Left|Rel_R|Rel_Right|Rel_Back|RelIndex)$/;
var ie2 = {
  Enterprise_Boundary: "ENTERPRISE",
  System_Boundary: "SYSTEM",
  Container_Boundary: "CONTAINER"
};
var ae = {
  Rel_U: "up",
  Rel_Up: "up",
  Rel_D: "down",
  Rel_Down: "down",
  Rel_L: "left",
  Rel_Left: "left",
  Rel_R: "right",
  Rel_Right: "right"
};
function oe(e2) {
  let t2 = e2.trim(), r = t2.length >= 2 && t2.startsWith('"') && t2.endsWith('"') ? t2.slice(1, -1) : t2;
  return he(r);
}
function se(e2) {
  let t2 = [], n2 = "", r = false;
  for (let i of e2) i === '"' && (r = !r), i === "," && !r ? (t2.push(n2), n2 = "") : n2 += i;
  return r ? null : (t2.push(n2), t2.map((e3) => e3.trim()).filter((e3) => !e3.startsWith("$")).map(oe));
}
var ce = /^([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*(\{)?\s*$/;
function T2(e2, t2) {
  throw Error(`C4 diagram, line ${e2.line}: ${t2} \u2014 "${e2.text}"`);
}
function le(e2) {
  let t2 = C2[e2[0]?.text.trim().toLowerCase() ?? ""];
  if (!t2) throw Error(`C4 diagram: expected a header of C4Context, C4Container, C4Component, C4Dynamic or C4Deployment, got "${e2[0]?.text ?? ""}"`);
  let r = {
    variant: t2,
    elements: [],
    boundaries: [],
    relationships: []
  }, i = /* @__PURE__ */ new Set(), a2 = [], o, s = (e3, t3) => (t3 || T2(e3, "missing alias (first argument)"), i.has(t3) && T2(e3, `duplicate alias "${t3}"`), i.add(t3), t3);
  for (let t3 = 1; t3 < e2.length; t3++) {
    let i2 = e2[t3], c = i2.text;
    if (c === "}") {
      a2.length === 0 && T2(i2, 'unmatched "}"'), a2.pop();
      continue;
    }
    if (c === "{") {
      o || T2(i2, 'unexpected "{"'), a2.push(o), o = void 0;
      continue;
    }
    o = void 0;
    let l = c.match(/^title(?:\s+(.*))?$/i);
    if (l) {
      r.title = he((l[1] ?? "").trim());
      continue;
    }
    if (ee2.test(c)) continue;
    let u3 = c.match(ce);
    u3 || T2(i2, "unrecognized statement");
    let d2 = u3[1], f2 = u3[3] === "{", p3 = se(u3[2]);
    p3 || T2(i2, "unbalanced quotes");
    let m3 = d2.match(te2);
    if (m3) {
      f2 && T2(i2, `"${d2}" cannot contain a block`);
      let e3 = m3[1].toLowerCase(), t4 = m3[2] === "Db" ? "db" : m3[2] === "Queue" ? "queue" : "default", n2 = e3 === "container" || e3 === "component", o2 = s(i2, p3[0]), c2 = {
        alias: o2,
        kind: e3,
        shape: t4,
        external: m3[3] !== void 0,
        label: p3[1] || o2
      }, l2 = n2 ? p3[2] : void 0, u4 = n2 ? p3[3] : p3[2];
      l2 && (c2.technology = l2), u4 && (c2.description = u4), r.elements.push(c2), a2.at(-1)?.elementAliases.push(o2);
      continue;
    }
    if (ne2.test(d2) || w.test(d2)) {
      let e3 = w.test(d2), t4 = s(i2, p3[0]), n2 = {
        alias: t4,
        label: p3[1] || t4,
        elementAliases: [],
        children: []
      };
      n2.type = ie2[d2] || (p3[2] && (e3 || d2 === "Boundary") ? p3[2] : e3 ? "node" : "system"), e3 && p3[3] && (n2.description = p3[3]);
      let c2 = a2.at(-1);
      c2 ? c2.children.push(n2) : r.boundaries.push(n2), f2 ? a2.push(n2) : o = n2;
      continue;
    }
    if (d2.match(re2)) {
      let e3 = d2 === "RelIndex" ? p3.slice(1) : p3;
      (!e3[0] || !e3[1]) && T2(i2, 'a relationship needs "from" and "to" aliases');
      let t4 = {
        from: e3[0],
        to: e3[1],
        label: e3[2] ?? "",
        bidirectional: d2 === "BiRel"
      };
      e3[3] && (t4.technology = e3[3]), d2 === "Rel_Back" && (t4.reversed = true);
      let n2 = ae[d2];
      n2 && (t4.layout = n2), r.relationships.push(t4);
      continue;
    }
    T2(i2, `unknown C4 macro "${d2}"`);
  }
  if (a2.length > 0) throw Error(`C4 diagram: boundary "${a2.at(-1).alias}" is missing its closing "}"`);
  r.variant === "dynamic" && r.relationships.forEach((e3, t3) => {
    e3.index = String(t3 + 1);
  });
  for (let e3 of r.relationships) for (let t3 of [e3.from, e3.to]) if (!i.has(t3)) throw Error(`C4 diagram: relationship refers to undeclared alias "${t3}"`);
  return r;
}
function ue(e2, t2) {
  let n2 = [];
  for (let r of e2.split("\n")) {
    let e3 = "";
    for (let i of r.split(/\s+/).filter(Boolean)) e3 && e3.length + 1 + i.length > t2 ? (n2.push(e3), e3 = i) : e3 = e3 ? `${e3} ${i}` : i;
    n2.push(e3);
  }
  return n2;
}
var de = {
  person: "Person",
  system: "Software System",
  container: "Container",
  component: "Component"
};
function fe(e2) {
  let t2 = (e2.kind === "container" || e2.kind === "component") && e2.technology ? `: ${e2.technology}` : "";
  return `[${de[e2.kind]}${t2}]`;
}
function pe2(e2) {
  return e2.type ? `[${e2.type}]` : void 0;
}
function me(e2) {
  let t2 = [], n2 = [e2.index ? `${e2.index}:` : "", e2.label].filter(Boolean).join(" ");
  return n2 && t2.push(n2), e2.technology && t2.push(`[${e2.technology}]`), t2;
}
function he2(e2) {
  switch (e2.layout) {
    case "up":
      return {
        source: e2.to,
        target: e2.from,
        axis: "vertical",
        explicit: true
      };
    case "left":
      return {
        source: e2.to,
        target: e2.from,
        axis: "horizontal",
        explicit: true
      };
    case "right":
      return {
        source: e2.from,
        target: e2.to,
        axis: "horizontal",
        explicit: true
      };
    case "down":
      return {
        source: e2.from,
        target: e2.to,
        axis: "vertical",
        explicit: true
      };
    default:
      return {
        source: e2.from,
        target: e2.to,
        axis: "vertical",
        explicit: false
      };
  }
}
var E = "<\\|--|<\\|\\.\\.|\\*--|o--|-->|--\\*|--o|--\\|>|\\.\\.>|\\.\\.\\|>|<--|<\\.\\.?|--";
var ge2 = new RegExp(E);
function _e(t2) {
  let i = {
    classes: [],
    relationships: [],
    namespaces: [],
    interactions: /* @__PURE__ */ new Map(),
    classDefs: /* @__PURE__ */ new Map(),
    classAssignments: /* @__PURE__ */ new Map(),
    nodeStyles: /* @__PURE__ */ new Map(),
    notes: []
  }, a2 = /* @__PURE__ */ new Map(), u3 = null, d2 = null, f2 = 0, p3;
  for (let r = 1; r < t2.length; r++) {
    let h3 = t2[r], g3 = h3.text;
    if (d2 && f2 > 0) {
      if (g3 === "}") {
        f2--, f2 === 0 && (d2 = null, p3 = void 0);
        continue;
      }
      let e2 = g3.match(/^<<(\w+)>>$/);
      if (e2) {
        d2.annotation = e2[1];
        continue;
      }
      if (g3.startsWith("<<")) throw Error(`Line ${h3.line}: Malformed class annotation "${g3}" \u2014 expected "<<name>>" (e.g. "<<interface>>").`);
      D2(d2, g3, h3.line);
      continue;
    }
    if (/^click\s+/i.test(g3)) {
      e(g3, i.interactions);
      continue;
    }
    let _3 = g3.match(/^note\s+(?:for\s+(\S+)\s+)?"([^"]*)"\s*$/);
    if (_3) {
      let e2 = _3[1];
      i.notes.push({
        text: he(_3[2]),
        ...e2 ? { forClass: e2 } : {}
      });
      continue;
    }
    if (be(g3, i) || Ce(g3, i) || Se(g3, i) || xe(g3, i)) continue;
    let v2 = g3.match(/^namespace\s+(\S+)\s*\{$/);
    if (v2) {
      u3 = {
        name: v2[1],
        classIds: []
      };
      continue;
    }
    if (g3 === "}" && u3) {
      i.namespaces.push(u3), u3 = null;
      continue;
    }
    let y3 = g3.match(/^class\s+(\S+?)(?:\s*~(\w+)~)?\s*\{$/);
    if (y3) {
      let e2 = m3(y3[1], y3[2]);
      d2 = a2.get(e2) ?? null, f2 = 1, p3 = h3.line;
      continue;
    }
    let b3 = g3.match(/^class\s+(\S+?)(?:\s*~(\w+)~)?\s*$/);
    if (b3) {
      m3(b3[1], b3[2]);
      continue;
    }
    let x3 = g3.match(/^class\s+(\S+?)\s*\{\s*(.*?)\s*\}$/);
    if (x3) {
      let e2 = m3(x3[1], void 0), t3 = a2.get(e2), n2 = x3[2], r2 = n2.match(/^<<(\w+)>>$/);
      if (t3 && r2) t3.annotation = r2[1];
      else if (t3 && n2.startsWith("<<")) throw Error(`Line ${h3.line}: Malformed class annotation "${n2}" \u2014 expected "<<name>>" (e.g. "<<interface>>").`);
      else t3 && n2 && D2(t3, n2, h3.line);
      continue;
    }
    let S3 = g3.match(/^(\S+?)\s*:\s*(.+)$/);
    if (S3) {
      let e2 = S3[2];
      if (!e2.match(/<\|--|--|\*--|o--|-->|\.\.>|\.\.\|>/)) {
        D2(O2(a2, S3[1]), e2, h3.line);
        continue;
      }
    }
    let C3 = be2(g3);
    if (C3) {
      C3.from = m3(C3.from, void 0, false), C3.to = m3(C3.to, void 0, false), i.relationships.push(C3);
      continue;
    }
    if (ge2.test(g3)) throw Error(`Line ${h3.line}: Malformed class-diagram relationship "${g3}". Expected "FROM ARROW TO" (optionally with cardinalities and a ": label"), e.g. "Animal <|-- Dog" or 'A "1" --> "*" B : label'. ARROW must be one of <|--, <|.., *--, o--, -->, --*, --o, --|>, ..>, ..|>, <--, <.., or --.`);
  }
  if (d2 !== null) throw Error(`Line ${p3}: Unclosed class body for "${d2.id}" \u2014 expected a closing "}" before the diagram ends.`);
  return i.classes = [...a2.values()], i;
  function m3(e2, t3, n2 = true) {
    let { id: o, className: s } = we(e2), c = o, l = t3;
    if (!l) {
      let e3 = o.match(/^(.+?)~(\w+)~$/);
      e3 && (c = e3[1], l = e3[2]);
    }
    let d3 = O2(a2, c);
    return l && (d3.label = `${c}<${l}>`), s && i.classAssignments.set(c, s), n2 && u3 && u3.classIds.push(c), c;
  }
}
function D2(e2, t2, n2) {
  let r = ye(t2, n2);
  r && (r.isMethod ? e2.methods.push(r.member) : e2.attributes.push(r.member));
}
function O2(e2, t2) {
  let n2 = e2.get(t2);
  return n2 || (n2 = {
    id: t2,
    label: t2,
    attributes: [],
    methods: []
  }, e2.set(t2, n2)), n2;
}
function k2(e2, t2) {
  return Math.max(0, e2.split(t2).length - 1);
}
function ve(e2) {
  let t2 = k2(e2, "~");
  if (t2 <= 1) return e2;
  let n2 = e2, r = false;
  t2 % 2 != 0 && n2.startsWith("~") && (n2 = n2.slice(1), r = true);
  let i = [...n2], a2 = i.indexOf("~"), o = i.lastIndexOf("~");
  for (; a2 !== -1 && o !== -1 && a2 !== o; ) i[a2] = "<", i[o] = ">", a2 = i.indexOf("~"), o = i.lastIndexOf("~");
  return r && i.unshift("~"), i.join("");
}
function A2(e2) {
  let t2 = e2.split(/(,)/), n2 = [];
  for (let e3 = 0; e3 < t2.length; e3++) {
    let r = t2[e3];
    if (r === "," && e3 > 0 && e3 + 1 < t2.length) {
      let i = t2[e3 - 1], a2 = t2[e3 + 1];
      k2(i, "~") === 1 && k2(a2, "~") === 1 && (r = `${i},${a2}`, e3++, n2.pop());
    }
    n2.push(ve(r));
  }
  return n2.join("");
}
function ye(e2, t2) {
  let n2 = e2.trim().replace(/;$/, "");
  if (!n2) return null;
  let r = "", i = n2, a2 = i[0];
  if ((a2 === "+" || a2 === "-" || a2 === "#" || a2 === "~") && (r = a2, i = i.slice(1).trim()), i.includes("(") && !i.includes(")")) throw Error(`Line ${t2}: Malformed class member "${n2}" \u2014 unclosed "(" in a method signature. Expected e.g. "+eat() void" or "+eat(Food f) void".`);
  let o = i.match(/^(.+?)\(([^)]*)\)(?:\s*(.+))?$/);
  if (o) {
    let e3 = A2(o[1].trim()), t3 = o[2]?.trim(), n3 = t3 ? A2(t3) : void 0, a3 = o[3]?.trim(), s2 = a3 ? A2(a3) : void 0, c2 = e3.endsWith("$") || i.includes("$"), l2 = e3.endsWith("*") || i.includes("*");
    return {
      member: {
        visibility: r,
        name: e3.replace(/[$*]$/, ""),
        type: s2 || void 0,
        isStatic: c2,
        isAbstract: l2,
        isMethod: true,
        params: n3
      },
      isMethod: true
    };
  }
  let s = A2(i), c = s.endsWith("$"), l = s.endsWith("*");
  return {
    member: {
      visibility: r,
      name: s.replace(/[$*]$/, ""),
      type: void 0,
      isStatic: c,
      isAbstract: l,
      isMethod: false
    },
    isMethod: false
  };
}
function be2(e2) {
  let t2 = e2.match(RegExp(`^(\\S+?)\\s+(?:"([^"]*?)"\\s+)?(${E})\\s+(?:"([^"]*?)"\\s+)?(\\S+?)(?::::([\\w][\\w-]*))?(?:\\s*:\\s*(.+))?$`));
  if (!t2) return null;
  let r = t2[1], i = t2[2], a2 = i ? he(i) : void 0, o = t2[3].trim(), s = t2[4], c = s ? he(s) : void 0, l = t2[6] ? `${t2[5]}:::${t2[6]}` : t2[5], u3 = t2[7]?.trim(), d2 = u3 ? he(u3) : void 0, f2 = j2(o);
  return f2 ? {
    from: r,
    to: l,
    type: f2.type,
    markerAt: f2.markerAt,
    label: d2,
    fromCardinality: a2,
    toCardinality: c
  } : null;
}
function j2(e2) {
  switch (e2.trim()) {
    case "<|--":
      return {
        type: "inheritance",
        markerAt: "from"
      };
    case "--|>":
      return {
        type: "inheritance",
        markerAt: "to"
      };
    case "<|..":
      return {
        type: "realization",
        markerAt: "from"
      };
    case "..|>":
      return {
        type: "realization",
        markerAt: "to"
      };
    case "*--":
      return {
        type: "composition",
        markerAt: "from"
      };
    case "--*":
      return {
        type: "composition",
        markerAt: "to"
      };
    case "o--":
      return {
        type: "aggregation",
        markerAt: "from"
      };
    case "--o":
      return {
        type: "aggregation",
        markerAt: "to"
      };
    case "-->":
      return {
        type: "association",
        markerAt: "to"
      };
    case "<--":
      return {
        type: "association",
        markerAt: "from"
      };
    case "..>":
      return {
        type: "dependency",
        markerAt: "to"
      };
    case "<..":
      return {
        type: "dependency",
        markerAt: "from"
      };
    case "--":
      return {
        type: "association",
        markerAt: "to"
      };
    default:
      return null;
  }
}
function M2(e2) {
  return `${e2.visibility ? `${e2.visibility} ` : ""}${e2.isMethod ? `${e2.name}(${e2.params || ""})` : e2.name}${e2.type ? `: ${e2.type}` : ""}`;
}
function N(e2) {
  let t2 = {
    entities: [],
    relationships: []
  }, r = /* @__PURE__ */ new Map(), i = null;
  for (let o = 1; o < e2.length; o++) {
    let s = e2[o], c = s.text;
    if (i) {
      if (c === "}") {
        i = null;
        continue;
      }
      let e3 = F(c);
      e3 && i.attributes.push(e3);
      continue;
    }
    let l = c.match(/^direction\s+(TD|TB|LR|BT|RL)\s*$/i);
    if (l) {
      t2.direction = ne(l[1]);
      continue;
    }
    let u3 = c.match(/^(\S+?)(?:\[(.+)\])?\s*\{(.*)$/);
    if (u3) {
      let e3 = u3[1], t3 = u3[2], a2 = P(r, e3, t3 === void 0 ? void 0 : he(t3.trim().replace(/^["']|["']$/g, ""))), o2 = u3[3].trim(), s2 = o2.endsWith("}"), c2 = s2 ? o2.slice(0, -1).trim() : o2;
      for (let e4 of c2.split(";").map((e5) => e5.trim()).filter(Boolean)) {
        let t4 = F(e4);
        t4 && a2.attributes.push(t4);
      }
      s2 || (i = a2);
      continue;
    }
    let d2 = xe2(c, s.line);
    if (d2) {
      P(r, d2.entity1), P(r, d2.entity2), t2.relationships.push(d2);
      continue;
    }
  }
  return t2.entities = [...r.values()], t2;
}
function P(e2, t2, n2) {
  let r = e2.get(t2);
  return r ? n2 !== void 0 && (r.label = n2) : (r = {
    id: t2,
    label: n2 ?? t2,
    attributes: []
  }, e2.set(t2, r)), r;
}
function F(e2) {
  let t2 = e2.match(/^(\S+)\s+(\S+)(?:\s+(.+))?$/);
  if (!t2) return null;
  let r = t2[1], i = t2[2], a2 = t2[3]?.trim() ?? "", o = [], s, c = a2.match(/"([^"]*)"/);
  c && (s = he(c[1]));
  let l = a2.replace(/"[^"]*"/, "").trim();
  for (let e3 of l.split(/\s+/)) {
    let t3 = e3.toUpperCase();
    (t3 === "PK" || t3 === "FK" || t3 === "UK") && o.push(t3);
  }
  return {
    type: r,
    name: i,
    keys: o,
    comment: s
  };
}
function xe2(e2, t2) {
  let r = e2.match(/^(\S+)\s+(\S*(?:--|\.\.)\S*)\s+(\S+)\s*(?::\s*(.*))?$/);
  if (!r) return null;
  let i = r[1], a2 = r[2], o = r[3], s = r[4] !== void 0, c = r[4]?.trim() ?? "", l = a2.match(/^([|o}{]*)(--|\.\.?)([|o}{]*)$/), u3 = l ? Se2(l[1]) : null, d2 = l ? Ce2(l[3]) : null;
  if (!u3 || !d2) throw Error(`Line ${t2}: Invalid ER relationship cardinality "${a2}" in "${e2}". Left side must be one of ||, |o, }|, }o; right side must be one of ||, o|, |{, o{ (e.g. "||--o{").`);
  if (!s || c.length === 0) throw Error(`Line ${t2}: ER relationship "${i} ${a2} ${o}" is missing a ": label" \u2014 expected e.g. "${i} ${a2} ${o} : label".`);
  return {
    entity1: i,
    entity2: o,
    cardinality1: u3,
    cardinality2: d2,
    label: he(c.replace(/^["']|["']$/g, "")),
    identifying: l[2] === "--"
  };
}
function Se2(e2) {
  return e2 === "||" ? "one" : e2 === "|o" ? "zero-one" : e2 === "}|" ? "many" : e2 === "}o" ? "zero-many" : null;
}
function Ce2(e2) {
  return e2 === "||" ? "one" : e2 === "o|" ? "zero-one" : e2 === "|{" ? "many" : e2 === "o{" ? "zero-many" : null;
}
var we2 = new Set("aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen".split(" "));
var Te = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
var Ee = /^(?:rgba?|hsla?)\(\s*[\d.%]+(?:[\s,/]+[\d.%]+){2,3}\s*\)$/i;
function I(e2) {
  return we2.has(e2.toLowerCase()) || Te.test(e2) || Ee.test(e2);
}
function L(e2) {
  let t2 = e2.trim(), n2 = t2.match(/^((?:rgba?|hsla?)\s*\([^)]*\)|#[0-9a-fA-F]+|\S+)?(.*)$/), r = n2?.[1] ?? "", i = n2?.[2]?.trim() ?? "";
  return r.toLowerCase() === "transparent" ? { label: i } : r !== "" && I(r) ? {
    color: r,
    label: i
  } : { label: t2 };
}
function R(e2) {
  return e2 === "loop" || e2 === "alt" || e2 === "opt" || e2 === "par" || e2 === "critical" || e2 === "break" || e2 === "rect";
}
function z(e2) {
  if (!R(e2)) throw Error(`Invalid block type: "${e2}"`);
  return e2;
}
var De = /^(.+?)\s*(<<->>|<<-->>|--?>?>)\s*([+-]?)(.+?)\s*:\s*(.+)$/;
var Oe = /^(.+?)\s*(<<->>|<<-->>|--?>?>|--?[)x]|--?>>|--?>)\s*([+-]?)(.+?)\s*:\s*(.+)$/;
function B(e2) {
  let t2 = {
    actors: [],
    messages: [],
    blocks: [],
    notes: [],
    activations: [],
    boxes: []
  }, r = {
    open: void 0,
    membership: /* @__PURE__ */ new Map()
  }, i = 0, a2, o = /* @__PURE__ */ new Set(), s = [], c = {
    enabled: false,
    next: 1,
    step: 1
  }, l, u3;
  for (let d2 = 1; d2 < e2.length; d2++) {
    let f2 = e2[d2], p3 = f2.text, m3 = p3.match(/^box(?:\s+(.*))?$/);
    if (m3) {
      if (r.open !== void 0) throw Error(`Line ${f2.line}: Sequence diagram: a box cannot be nested inside another box \u2014 close the open box with "end" first`);
      let { color: e3, label: o2 } = L(m3[1] ?? ""), c2 = {
        label: he(o2),
        actorIds: []
      };
      e3 !== void 0 && (c2.color = e3), t2.boxes.push(c2), r.open = t2.boxes.length - 1, i = s.length, a2 = f2.line;
      continue;
    }
    let h3 = p3.match(/^create\s+(participant|actor)\s+(\S+?)(?:\s+as\s+(.+))?$/);
    if (h3) {
      let e3 = h3[1] === "actor" ? "actor" : "participant", i2 = h3[2];
      if (o.has(i2)) throw Error(`Line ${f2.line}: It is not possible to have actors with the same id, even if one is destroyed before the next is created. Use 'AS' aliases to simulate the behavior`);
      o.add(i2), t2.actors.push({
        id: i2,
        label: he(h3[3]?.trim() ?? i2),
        type: e3
      }), U(t2, r, i2, f2.line), l = i2;
      continue;
    }
    let g3 = p3.match(/^destroy\s+(.+)$/);
    if (g3) {
      let e3 = g3[1].trim();
      H(t2, o, r, e3, f2.line), u3 = e3;
      continue;
    }
    let _3 = p3.match(/^autonumber(?:\s+(off|\d+(?:\.\d{1,2})?)(?:\s+(\d+(?:\.\d{1,2})?))?)?$/);
    if (_3) {
      let e3 = _3[1], t3 = _3[2];
      e3 === "off" ? c.enabled = false : (c.enabled = true, c.next = e3 === void 0 ? 1 : Number(e3), c.step = t3 === void 0 ? 1 : Number(t3));
      continue;
    }
    let v2 = p3.match(/^(participant|actor)\s+(\S+?)(?:\s+as\s+(.+))?$/);
    if (v2) {
      let e3 = v2[1] === "actor" ? "actor" : "participant", i2 = v2[2], a3 = v2[3]?.trim() ?? i2, s2 = he(a3);
      o.has(i2) || (o.add(i2), t2.actors.push({
        id: i2,
        label: s2,
        type: e3
      })), U(t2, r, i2, f2.line);
      continue;
    }
    let y3 = p3.match(/^Note\s+(left of|right of|over)\s+([^:]+):\s*(.+)$/i);
    if (y3) {
      let e3 = y3[1].toLowerCase(), i2 = y3[2].trim(), a3 = he(y3[3].trim()), s2 = i2.split(",").map((e4) => e4.trim());
      for (let e4 of s2) H(t2, o, r, e4, f2.line);
      let c2 = "over";
      e3 === "left of" ? c2 = "left" : e3 === "right of" && (c2 = "right"), t2.notes.push({
        actorIds: s2,
        text: a3,
        position: c2,
        afterIndex: t2.messages.length - 1
      });
      continue;
    }
    let b3 = p3.match(/^(loop|alt|opt|par|critical|break|rect)\s*(.*)$/);
    if (b3) {
      let e3 = z(b3[1]), r2 = b3[2]?.trim() ?? "", i2 = he(r2);
      s.push({
        type: e3,
        label: i2,
        startIndex: t2.messages.length,
        dividers: [],
        line: f2.line
      });
      continue;
    }
    let x3 = p3.match(/^(else|and)\s*(.*)$/);
    if (x3 && s.length > 0) {
      let e3 = x3[2]?.trim() ?? "", r2 = he(e3);
      s[s.length - 1].dividers.push({
        index: t2.messages.length,
        label: r2
      });
      continue;
    }
    if (p3 === "end" && r.open !== void 0 && s.length === i) {
      r.open = void 0, a2 = void 0;
      continue;
    }
    if (p3 === "end" && s.length > 0) {
      let e3 = s.pop();
      t2.blocks.push({
        type: e3.type,
        label: e3.label,
        startIndex: e3.startIndex,
        endIndex: Math.max(t2.messages.length - 1, e3.startIndex),
        dividers: e3.dividers
      });
      continue;
    }
    if (p3 === "end") throw Error(`Line ${f2.line}: Sequence diagram: "end" does not match any open block ("loop"/"alt"/"opt"/"par"/"critical"/"break"/"rect") or "box" \u2014 nothing is currently open to close.`);
    let S3 = p3.match(/^(activate|deactivate)\s+(.+)$/);
    if (S3) {
      let e3 = S3[2].trim();
      H(t2, o, r, e3, f2.line), t2.activations.push({
        actorId: e3,
        kind: S3[1] === "activate" ? "start" : "end",
        afterIndex: t2.messages.length - 1
      });
      continue;
    }
    let C3 = p3.match(De) ?? p3.match(Oe);
    if (C3) {
      let e3 = C3[2], n2 = C3[4][0];
      if (n2 === ">" || n2 === ")") throw Error(`Line ${f2.line}: Malformed sequence-diagram arrow in "${p3}" \u2014 "${e3}${n2}" is not a recognized arrow. Expected one of: ->, -->, ->>, -->>, -x, --x, -), --), <<->>, <<-->>.`);
      ke(t2, o, r, c, C3[1], C3[2], C3[3], C3[4], C3[5], f2.line);
      let i2 = t2.messages.length - 1, a3 = t2.messages[i2];
      if (l !== void 0) {
        if (a3.to !== l) throw Error(`Line ${f2.line}: The created participant ${l} does not have an associated creating message after its declaration. Please check the sequence diagram.`);
        V(t2, l).createdAt = i2, l = void 0;
      }
      if (u3 !== void 0) {
        if (a3.from !== u3 && a3.to !== u3) throw Error(`Line ${f2.line}: The destroyed participant ${u3} does not have an associated destroying message after its declaration. Please check the sequence diagram.`);
        V(t2, u3).destroyedAt = i2, u3 = void 0;
      }
      continue;
    }
  }
  if (s.length > 0) {
    let e3 = s[s.length - 1];
    throw Error(`Line ${e3.line}: Sequence diagram: unclosed "${e3.type}" block \u2014 expected a matching "end" before the diagram ends.`);
  }
  if (r.open !== void 0) {
    let e3 = t2.boxes[r.open];
    throw Error(`Line ${a2}: Sequence diagram: unclosed "box${e3.label ? ` ${e3.label}` : ""}" \u2014 expected a matching "end" before the diagram ends.`);
  }
  return t2;
}
function V(e2, t2) {
  let n2 = e2.actors.find((e3) => e3.id === t2);
  if (n2 === void 0)
    throw Error(`Sequence diagram: unknown actor "${t2}"`);
  return n2;
}
function H(e2, t2, n2, r, i) {
  t2.has(r) || (t2.add(r), e2.actors.push({
    id: r,
    label: r,
    type: "participant"
  })), U(e2, n2, r, i);
}
function U(e2, t2, n2, r) {
  let i = t2.open;
  if (i === void 0) return;
  let a2 = t2.membership.get(n2);
  if (a2 !== i) {
    if (a2 !== void 0) {
      let t3 = e2.boxes[a2].label, o = e2.boxes[i].label;
      throw Error(`Line ${r}: A same participant should only be defined in one Box: ${n2} can't be in '${t3}' and in '${o}' at the same time.`);
    }
    t2.membership.set(n2, i), e2.boxes[i].actorIds.push(n2);
  }
}
function ke(e2, t2, r, i, a2, o, s, c, l, u3) {
  H(e2, t2, r, a2, u3), H(e2, t2, r, c, u3);
  let d2 = o === "<<->>" || o === "<<-->>", f2 = d2 ? o === "<<-->>" ? "dashed" : "solid" : o.startsWith("--") ? "dashed" : "solid", p3 = o.includes(">>") || o.includes("x") ? "filled" : "open", m3 = o.includes("x"), h3 = {
    from: a2,
    to: c,
    label: he(l.trim()),
    lineStyle: f2,
    arrowHead: p3
  };
  m3 && (h3.isLost = true), d2 && (h3.bidirectional = true), s === "+" && (h3.activate = true), s === "-" && (h3.deactivate = true), i.enabled && (h3.seqNumber = i.next, i.next = Math.round((i.next + i.step) * 100) / 100), e2.messages.push(h3);
}
function je(e2) {
  let t2 = {}, n2 = {}, r = [], i, a2 = false;
  for (let o of e2) {
    let e3 = o.text;
    if (/^xychart(-beta)?\b/i.test(e3)) {
      /\bhorizontal\b/i.test(e3) && (a2 = true);
      continue;
    }
    let s = e3.match(/^title\s+"([^"]+)"/);
    if (s) {
      i = s[1];
      continue;
    }
    let c = e3.match(/^x-axis\s+(?:"([^"]*)"\s*)?\[([^\]]+)\]/);
    if (c) {
      c[1] && (t2.title = c[1]), t2.categories = Me(c[2]).map((e4) => Ne(e4.trim()));
      continue;
    }
    let l = e3.match(/^x-axis\s+(?:"([^"]*)"\s+)?(-?\d+(?:\.\d+)?)\s*-->\s*(-?\d+(?:\.\d+)?)/);
    if (l) {
      l[1] && (t2.title = l[1]), t2.range = {
        min: parseFloat(l[2]),
        max: parseFloat(l[3])
      };
      continue;
    }
    let u3 = e3.match(/^y-axis\s+(?:"([^"]*)"\s+)?(-?\d+(?:\.\d+)?)\s*-->\s*(-?\d+(?:\.\d+)?)/);
    if (u3) {
      u3[1] && (n2.title = u3[1]), n2.range = {
        min: parseFloat(u3[2]),
        max: parseFloat(u3[3])
      };
      continue;
    }
    let d2 = e3.match(/^y-axis\s+"([^"]+)"\s*$/);
    if (d2) {
      n2.title = d2[1];
      continue;
    }
    let f2 = e3.match(/^bar\s+\[([^\]]+)\]/);
    if (f2) {
      r.push({
        type: "bar",
        data: K(f2[1], "bar", e3, o.line)
      });
      continue;
    }
    let p3 = e3.match(/^line\s+\[([^\]]+)\]/);
    if (p3) {
      r.push({
        type: "line",
        data: K(p3[1], "line", e3, o.line)
      });
      continue;
    }
    let m3 = e3.match(/^(x-axis|y-axis|bar|line|title)\b/i);
    if (m3) throw Fe(m3[1].toLowerCase(), e3, o.line);
  }
  if (!n2.range && r.length > 0) {
    let e3 = r.flatMap((e4) => e4.data), t3 = Math.min(...e3), i2 = Math.max(...e3), a3 = i2 - t3 || 1;
    t3 -= a3 * 0.1, i2 += a3 * 0.1, t3 > 0 && t3 < a3 * 0.5 && (t3 = 0), n2.range = {
      min: t3,
      max: i2
    };
  }
  return n2.range ||= {
    min: 0,
    max: 100
  }, {
    title: i,
    horizontal: a2,
    xAxis: t2,
    yAxis: n2,
    series: r
  };
}
function Me(e2) {
  let t2 = [], n2 = "", r = false;
  for (let i of e2) i === '"' ? (r = !r, n2 += i) : i === "," && !r ? (t2.push(n2), n2 = "") : n2 += i;
  return t2.push(n2), t2;
}
function Ne(e2) {
  return e2.length >= 2 && e2.startsWith('"') && e2.endsWith('"') ? e2.slice(1, -1) : e2;
}
function K(e2, t2, n2, r) {
  return e2.split(",").map((e3, i) => {
    let a2 = e3.trim(), o = parseFloat(a2);
    if (a2.length === 0 || Number.isNaN(o)) throw Error(`Line ${r}: Invalid numeric value ${JSON.stringify(a2)} at position ${i + 1} in "${n2}". Every value in a ${t2} [...] list must be a number.`);
    return o;
  });
}
var Pe = {
  "x-axis": "x-axis [A, B, C] (categories) or x-axis 0 --> 100 (numeric range), either optionally preceded by a quoted title",
  "y-axis": 'y-axis 0 --> 100 (numeric range) or y-axis "Title" (title only), optionally preceded by a quoted title before a range',
  bar: "bar [10, 20, 30] \u2014 a comma-separated numeric array in square brackets",
  line: "line [10, 20, 30] \u2014 a comma-separated numeric array in square brackets",
  title: 'title "Chart Title" \u2014 a double-quoted string'
};
function Fe(e2, t2, n2) {
  let r = Pe[e2] ?? e2;
  return /* @__PURE__ */ Error(`Line ${n2}: Malformed xychart-beta "${e2}" directive: "${t2}". Expected: ${r}.`);
}
var q2 = "#3b82f6";
function J(e2) {
  let t2 = e2.replace("#", ""), n2 = parseInt(t2.substring(0, 2), 16) / 255, r = parseInt(t2.substring(2, 4), 16) / 255, i = parseInt(t2.substring(4, 6), 16) / 255, a2 = Math.max(n2, r, i), o = Math.min(n2, r, i), s = (a2 + o) / 2;
  if (a2 === o) return [
    0,
    0,
    s * 100
  ];
  let c = a2 - o, l = s > 0.5 ? c / (2 - a2 - o) : c / (a2 + o), u3;
  return u3 = a2 === n2 ? ((r - i) / c + (r < i ? 6 : 0)) / 6 : a2 === r ? ((i - n2) / c + 2) / 6 : ((n2 - r) / c + 4) / 6, [
    u3 * 360,
    l * 100,
    s * 100
  ];
}
function Ie(e2, t2, n2) {
  let r = t2 / 100, i = n2 / 100, a2 = (1 - Math.abs(2 * i - 1)) * r, o = a2 * (1 - Math.abs(e2 / 60 % 2 - 1)), s = i - a2 / 2, c, l, u3;
  e2 < 60 ? (c = a2, l = o, u3 = 0) : e2 < 120 ? (c = o, l = a2, u3 = 0) : e2 < 180 ? (c = 0, l = a2, u3 = o) : e2 < 240 ? (c = 0, l = o, u3 = a2) : e2 < 300 ? (c = o, l = 0, u3 = a2) : (c = a2, l = 0, u3 = o);
  let d2 = (e3) => Math.round((e3 + s) * 255).toString(16).padStart(2, "0");
  return `#${d2(c)}${d2(l)}${d2(u3)}`;
}
function Y(e2) {
  return /^#[0-9a-fA-F]{6}$/.test(e2);
}
function X(e2) {
  return J(e2)[2] < 50;
}
function Le(e2, t2, n2) {
  if (e2 === 0) return t2;
  let r = Y(t2) ? t2 : q2, i = n2 && Y(n2) ? n2 : void 0, [a2, o] = J(r), s = Math.max(55, Math.min(85, o)), c = Math.ceil(e2 / 2), l = e2 % 2 == 1, u3 = i && X(i) ? !l : l, d2 = u3 ? Math.max(25, 48 - c * 13) : Math.min(78, 55 + c * 11);
  return Ie(((a2 + (u3 ? -8 : -12) * c) % 360 + 360) % 360, s, d2);
}
var Z = {
  rect: "rectangle",
  rectangle: "rectangle",
  proc: "rectangle",
  process: "rectangle",
  "normal-rect": "rectangle",
  rounded: "rounded",
  event: "rounded",
  "rounded-rect": "rounded",
  stadium: "stadium",
  pill: "stadium",
  terminal: "stadium",
  subproc: "subroutine",
  subprocess: "subroutine",
  subroutine: "subroutine",
  "framed-rectangle": "subroutine",
  "fr-rect": "subroutine",
  cyl: "cylinder",
  cylinder: "cylinder",
  db: "cylinder",
  database: "cylinder",
  "h-cyl": "cylinder",
  das: "cylinder",
  "horizontal-cylinder": "cylinder",
  "lin-cyl": "cylinder",
  "lined-cylinder": "cylinder",
  disk: "cylinder",
  circ: "circle",
  circle: "circle",
  start: "circle",
  "dbl-circ": "doublecircle",
  "double-circle": "doublecircle",
  stop: "doublecircle",
  "f-circ": "filled-circle",
  "filled-circle": "filled-circle",
  junction: "filled-circle",
  "cross-circ": "crossed-circle",
  "crossed-circle": "crossed-circle",
  summary: "crossed-circle",
  diam: "diamond",
  diamond: "diamond",
  decision: "diamond",
  question: "diamond",
  hex: "hexagon",
  hexagon: "hexagon",
  prepare: "hexagon",
  odd: "asymmetric",
  "rect-left-inv-arrow": "asymmetric",
  "lean-r": "parallelogram",
  "lean-right": "parallelogram",
  "in-out": "parallelogram",
  "lean-l": "parallelogram-alt",
  "lean-left": "parallelogram-alt",
  "out-in": "parallelogram-alt",
  "trap-b": "trapezoid",
  "trapezoid-bottom": "trapezoid",
  priority: "trapezoid",
  "trap-t": "trapezoid-alt",
  "trapezoid-top": "trapezoid-alt",
  manual: "trapezoid-alt",
  "curv-trap": "trapezoid-alt",
  "curved-trapezoid": "trapezoid-alt",
  display: "trapezoid-alt",
  doc: "document",
  document: "document",
  "lin-doc": "document",
  "lined-document": "document",
  "tag-doc": "document",
  "tagged-document": "document",
  docs: "stacked-document",
  documents: "stacked-document",
  "st-doc": "stacked-document",
  "stacked-document": "stacked-document",
  "notch-rect": "card",
  card: "card",
  "notched-rectangle": "card",
  "lin-rect": "lined-process",
  "lined-rectangle": "lined-process",
  "lin-proc": "lined-process",
  "shaded-process": "lined-process",
  "div-rect": "divided-process",
  "divided-rectangle": "divided-process",
  "div-proc": "divided-process",
  "tag-rect": "rectangle",
  "tagged-rectangle": "rectangle",
  "tag-proc": "rectangle",
  procs: "stacked-process",
  processes: "stacked-process",
  "st-rect": "stacked-process",
  "stacked-rectangle": "stacked-process",
  tri: "triangle",
  triangle: "triangle",
  extract: "triangle",
  "flip-tri": "flipped-triangle",
  "flipped-triangle": "flipped-triangle",
  "manual-file": "flipped-triangle",
  "win-pane": "window-pane",
  "window-pane": "window-pane",
  "internal-storage": "window-pane",
  fork: "fork-join",
  join: "fork-join",
  "long-rect": "fork-join",
  "notch-pent": "notched-pentagon",
  "loop-limit": "notched-pentagon",
  "notched-pentagon": "notched-pentagon",
  "sl-rect": "sloped-rectangle",
  "sloped-rectangle": "sloped-rectangle",
  "manual-input": "sloped-rectangle",
  flag: "flag",
  "paper-tape": "flag",
  "bow-rect": "bow-tie-rectangle",
  "bow-tie-rectangle": "bow-tie-rectangle",
  "stored-data": "bow-tie-rectangle",
  delay: "half-rounded-rectangle",
  "half-rounded-rectangle": "half-rounded-rectangle",
  brace: "brace",
  "brace-l": "brace",
  comment: "brace",
  "brace-r": "brace-right",
  braces: "braces",
  bolt: "bolt",
  "com-link": "bolt",
  "lightning-bolt": "bolt",
  text: "text",
  anchor: "anchor"
};
function Re(e2) {
  return Z[e2.trim().toLowerCase()];
}
function ze(e2) {
  let t2 = {};
  for (let n2 of Be(e2, ",")) {
    let e3 = n2.trim();
    if (e3.length === 0) continue;
    let r = Ve(e3, ":");
    if (r === -1) {
      t2.shape ??= $(e3);
      continue;
    }
    let i = e3.slice(0, r).trim().toLowerCase(), a2 = $(e3.slice(r + 1).trim());
    i.length > 0 && (t2[i] = a2);
  }
  return t2;
}
function Be(e2, t2) {
  let n2 = [], r = "", i = null;
  for (let a2 of e2) {
    if (i !== null) {
      r += a2, a2 === i && (i = null);
      continue;
    }
    if (a2 === '"' || a2 === "'") {
      i = a2, r += a2;
      continue;
    }
    if (a2 === t2) {
      n2.push(r), r = "";
      continue;
    }
    r += a2;
  }
  return n2.push(r), n2;
}
function Ve(e2, t2) {
  let n2 = null;
  for (let r = 0; r < e2.length; r++) {
    let i = e2[r];
    if (n2 !== null) {
      i === n2 && (n2 = null);
      continue;
    }
    if (i === '"' || i === "'") {
      n2 = i;
      continue;
    }
    if (i === t2) return r;
  }
  return -1;
}
function $(e2) {
  return e2.length >= 2 && (e2.startsWith('"') && e2.endsWith('"') || e2.startsWith("'") && e2.endsWith("'")) ? e2.slice(1, -1) : e2;
}
function He(e2) {
  if (!e2.startsWith("@{")) return;
  let t2 = 0, n2 = null;
  for (let r = 1; r < e2.length; r++) {
    let i = e2[r];
    if (n2 !== null) {
      i === n2 && (n2 = null);
      continue;
    }
    if (i === '"' || i === "'") {
      n2 = i;
      continue;
    }
    if (i === "{") {
      t2++;
      continue;
    }
    if (i === "}" && (t2--, t2 === 0)) return {
      body: e2.slice(2, r),
      length: r + 1
    };
  }
}

// node_modules/@zombie-mermaid/ascii-renderer/dist/index.js
function ie3(e2) {
  return [e2.length - 1, (e2[0]?.length ?? 1) - 1];
}
var M3 = "\x1B]8;;\x1B\\";
function ae2(e2) {
  return `\x1B]8;;${e2.replace(/[^\x21-\x7e]/gu, (e3) => encodeURIComponent(e3))}\x1B\\`;
}
var N2 = /\x1b\]8;[^\x07\x1b]*(?:\x1b\\|\x07)/g;
function P2(e2) {
  return e2.replace(N2, "");
}
function oe2(e2, t2) {
  let n2 = [];
  for (let r = 0; r <= e2; r++) {
    let e3 = [];
    for (let n3 = 0; n3 <= t2; n3++) e3.push(null);
    n2.push(e3);
  }
  return n2;
}
function F2(e2, t2, n2, r) {
  let i = e2[t2];
  i === void 0 || n2 < 0 || n2 >= i.length || (i[n2] = r);
}
function I2(e2) {
  for (let t2 of e2) t2.reverse();
  return e2;
}
function L2(e2) {
  return e2.reverse(), e2;
}
function se2(e2, t2, n2, r, i) {
  let [a2, o] = ie3(t2), s = Math.max(1, i?.from ?? 1), c = Math.min(o - 1, i?.to ?? o - 1);
  for (let i2 = s; i2 <= c; i2++) {
    let o2 = -1, s2 = -1;
    for (let e3 = 1; e3 <= a2 - 1; e3++) t2[e3]?.[i2] !== " " && (o2 === -1 && (o2 = e3), s2 = e3);
    if (o2 !== -1) for (let t3 = o2; t3 <= s2; t3++) F2(e2, t3 + n2.x, i2 + n2.y, r);
  }
}
function ce2(e2, t2) {
  let [n2, r] = ie3(e2.canvas), i = oe2(n2, r);
  for (let n3 of e2.nodes) {
    if (!n3.drawing || !n3.drawingCoord) continue;
    let e3 = t(t2.get(n3.name)?.href);
    e3 !== void 0 && se2(i, n3.drawing, n3.drawingCoord, e3);
  }
  return i;
}
var le2 = class {
  current = null;
  advance(e2) {
    if (e2 === this.current) return "";
    let t2 = this.current === null ? "" : M3;
    return e2 !== null && (t2 += ae2(e2)), this.current = e2, t2;
  }
  finish() {
    let e2 = this.current === null ? "" : M3;
    return this.current = null, e2;
  }
};
function R2(e2, t2) {
  let n2 = new le2(), r = "";
  for (let [i, a2] of e2.entries()) r += n2.advance(t2[i] ?? null) + a2;
  return r + n2.finish();
}
var z2 = {
  fg: "#27272a",
  border: "#a1a1aa",
  line: "#71717a",
  arrow: "#52525b",
  corner: "#71717a",
  junction: "#a1a1aa"
};
function de2() {
  let e2 = globalThis.process;
  if (e2) {
    if (!e2.stdout?.isTTY) return "none";
    let t2 = e2.env?.COLORTERM?.toLowerCase() ?? "", n2 = e2.env?.TERM?.toLowerCase() ?? "";
    return t2 === "truecolor" || t2 === "24bit" ? "truecolor" : n2.includes("256color") || n2.includes("256") ? "ansi256" : n2 && n2 !== "dumb" ? "ansi16" : "none";
  }
  return typeof document < "u" ? "html" : "none";
}
function fe2(e2) {
  return a(e2.startsWith("#") ? e2 : `#${e2}`) ?? {
    r: 0,
    g: 0,
    b: 0
  };
}
var pe3 = "\x1B[";
var me2 = `${pe3}0m`;
function he3(e2) {
  let { r: t2, g: n2, b: r } = fe2(e2);
  return `${pe3}38;2;${t2};${n2};${r}m`;
}
function ge3(e2, t2, n2) {
  let r = (e2 + t2 + n2) / 3;
  if (Math.max(Math.abs(e2 - r), Math.abs(t2 - r), Math.abs(n2 - r)) < 10) {
    let e3 = Math.round(r / 255 * 23);
    return 232 + Math.min(23, Math.max(0, e3));
  }
  let i = (e3) => e3 < 48 ? 0 : e3 < 115 ? 1 : Math.min(5, Math.floor((e3 - 35) / 40)), a2 = i(e2), o = i(t2), s = i(n2);
  return 16 + 36 * a2 + 6 * o + s;
}
function _e2(e2) {
  let { r: t2, g: n2, b: r } = fe2(e2);
  return `${pe3}38;5;${ge3(t2, n2, r)}m`;
}
function ve2(e2) {
  let { r: t2, g: n2, b: r } = fe2(e2), i = 0.299 * t2 + 0.587 * n2 + 0.114 * r, a2 = i > 100 ? 0 : 60, o;
  return o = t2 > 180 && n2 < 100 && r < 100 ? 31 : n2 > 180 && t2 < 100 && r < 100 ? 32 : t2 > 150 && n2 > 150 && r < 100 ? 33 : r > 180 && t2 < 100 && n2 < 100 ? 34 : t2 > 150 && r > 150 && n2 < 100 ? 35 : n2 > 150 && r > 150 && t2 < 100 ? 36 : i > 200 ? 37 : i < 50 ? 30 : 37, `${pe3}${o + a2}m`;
}
function ye2(e2) {
  return e2.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
var B2 = /^█+$/;
function be3(e2, t2) {
  return `<span style="${B2.test(t2) ? `color:${e2};background:${e2}` : `color:${e2}`}">${ye2(t2)}</span>`;
}
function xe3(e2, t2) {
  switch (e2) {
    case "text":
      return t2.fg;
    case "border":
      return t2.border;
    case "line":
      return t2.line;
    case "arrow":
      return t2.arrow;
    case "corner":
      return t2.corner ?? t2.line;
    case "junction":
      return t2.junction ?? t2.border;
    default:
      return t2.fg;
  }
}
function Se3(e2, t2, n2) {
  if (n2 === "none") return "";
  let r = xe3(e2, t2);
  switch (n2) {
    case "truecolor":
      return he3(r);
    case "ansi256":
      return _e2(r);
    case "ansi16":
      return ve2(r);
    default:
      return "";
  }
}
function Ce3(e2, t2, n2, r, i) {
  if (r === "none") return i ? R2(e2, i) : e2.join("");
  if (r === "html") return we3(e2, t2, n2);
  let a2 = new le2(), o = "", s = null, c = "";
  for (let [l, u3] of e2.entries()) {
    let e3 = t2[l] ?? null, d2 = i ? a2.advance(i[l] ?? null) : "";
    if (u3 === " ") {
      c.length > 0 && (o += s === null ? c : Se3(s, n2, r) + c + me2, c = "", s = null), o += d2 + u3;
      continue;
    }
    if (e3 === s) {
      c += d2 + u3;
      continue;
    }
    c.length > 0 && (o += s === null ? c : Se3(s, n2, r) + c + me2), c = d2 + u3, s = e3;
  }
  return c.length > 0 && s !== null ? o += Se3(s, n2, r) + c + me2 : c.length > 0 && (o += c), o + a2.finish();
}
function we3(e2, t2, n2) {
  let r = "", i = null, a2 = "", o = () => {
    a2.length !== 0 && (r += i === null ? ye2(a2) : be3(xe3(i, n2), a2), a2 = "", i = null);
  };
  for (let [n3, s] of e2.entries()) {
    let e3 = t2[n3] ?? null;
    if (s === " ") {
      o(), r += " ";
      continue;
    }
    if (e3 === i) {
      a2 += s;
      continue;
    }
    o(), a2 = s, i = e3;
  }
  return o(), r;
}
function Te2(e2, t2, n2) {
  if (n2 === "none" || e2.length === 0) return e2;
  if (n2 === "html") return be3(t2, e2);
  let r;
  switch (n2) {
    case "truecolor":
      r = he3(t2);
      break;
    case "ansi256":
      r = _e2(t2);
      break;
    case "ansi16":
      r = ve2(t2);
      break;
    default:
      return e2;
  }
  return `${r}${e2}${me2}`;
}
var Ee2 = /\p{Mn}|\p{Me}/u;
function De2(e2) {
  return Ee2.test(e2);
}
var V2 = new Intl.Segmenter(void 0, { granularity: "grapheme" });
var Oe2 = "\uFE0F";
function ke2(e2) {
  let t2 = [];
  for (let { segment: n2 } of V2.segment(e2)) t2.push(n2);
  return t2;
}
function Ae(e2) {
  if (e2.includes(Oe2)) return 2;
  let t2 = false, n2 = false;
  for (let r of e2) M(r) && (t2 = true), De2(r) || (n2 = true);
  return t2 ? 2 : +!!n2;
}
function H2(e2) {
  let t2 = 0;
  for (let n2 of ke2(e2)) t2 += Ae(n2);
  return t2;
}
function je2(e2) {
  let t2 = [];
  for (let n2 of ke2(e2)) {
    let e3 = Ae(n2);
    e3 !== 0 && (t2.push(n2), e3 === 2 && t2.push(""));
  }
  return t2;
}
function U2(e2, t2) {
  let n2 = [];
  for (let r = 0; r <= e2; r++) {
    let e3 = [];
    for (let n3 = 0; n3 <= t2; n3++) e3.push(" ");
    n2.push(e3);
  }
  return n2;
}
function W(e2) {
  let [t2, n2] = Fe2(e2);
  return U2(t2, n2);
}
function Me2(e2, t2) {
  let n2 = [];
  for (let r = 0; r <= e2; r++) {
    let e3 = [];
    for (let n3 = 0; n3 <= t2; n3++) e3.push(null);
    n2.push(e3);
  }
  return n2;
}
function Ne2(e2, t2, n2) {
  let r = e2.length - 1, i = (e2[0]?.length ?? 1) - 1, a2 = Me2(Math.max(t2, r), Math.max(n2, i));
  for (let t3 = 0; t3 < a2.length; t3++) for (let n3 = 0; n3 < (a2[0]?.length ?? 0); n3++) t3 < e2.length && n3 < (e2[0]?.length ?? 0) && (a2[t3][n3] = e2[t3][n3]);
  return e2.length = 0, e2.push(...a2), e2;
}
function Pe2(e2, t2, n2, r) {
  (t2 >= e2.length || n2 >= (e2[0]?.length ?? 0)) && Ne2(e2, t2, n2), e2[t2][n2] = r;
}
function Fe2(e2) {
  return [e2.length - 1, (e2[0]?.length ?? 1) - 1];
}
function Ie2(e2, t2, n2) {
  let [r, i] = Fe2(e2), a2 = U2(Math.max(t2, r), Math.max(n2, i));
  for (let t3 = 0; t3 < a2.length; t3++) for (let n3 = 0; n3 < (a2[0]?.length ?? 0); n3++) t3 < e2.length && n3 < (e2[0]?.length ?? 0) && (a2[t3][n3] = e2[t3][n3]);
  return e2.length = 0, e2.push(...a2), e2;
}
function G(e2, t2, n2, r, i) {
  let [a2, o] = Fe2(e2);
  t2 < 0 || t2 > a2 || n2 < 0 || n2 > o || (e2[t2][n2] = r, i && Pe2(i.roleCanvas, t2, n2, i.role));
}
var Le2 = /* @__PURE__ */ new Set([
  "\u2500",
  "\u2502",
  "\u250C",
  "\u2510",
  "\u2514",
  "\u2518",
  "\u251C",
  "\u2524",
  "\u252C",
  "\u2534",
  "\u253C",
  "\u2574",
  "\u2575",
  "\u2576",
  "\u2577"
]);
function Re2(e2) {
  return Le2.has(e2);
}
function ze2(e2) {
  return /^[a-zA-Z0-9]$/.test(e2);
}
var Be2 = {
  "\u2500": {
    "\u2502": "\u253C",
    "\u250C": "\u252C",
    "\u2510": "\u252C",
    "\u2514": "\u2534",
    "\u2518": "\u2534",
    "\u251C": "\u253C",
    "\u2524": "\u253C",
    "\u252C": "\u252C",
    "\u2534": "\u2534"
  },
  "\u2502": {
    "\u2500": "\u253C",
    "\u250C": "\u251C",
    "\u2510": "\u2524",
    "\u2514": "\u251C",
    "\u2518": "\u2524",
    "\u251C": "\u251C",
    "\u2524": "\u2524",
    "\u252C": "\u253C",
    "\u2534": "\u253C"
  },
  "\u250C": {
    "\u2500": "\u252C",
    "\u2502": "\u251C",
    "\u2510": "\u252C",
    "\u2514": "\u251C",
    "\u2518": "\u253C",
    "\u251C": "\u251C",
    "\u2524": "\u253C",
    "\u252C": "\u252C",
    "\u2534": "\u253C"
  },
  "\u2510": {
    "\u2500": "\u252C",
    "\u2502": "\u2524",
    "\u250C": "\u252C",
    "\u2514": "\u253C",
    "\u2518": "\u2524",
    "\u251C": "\u253C",
    "\u2524": "\u2524",
    "\u252C": "\u252C",
    "\u2534": "\u253C"
  },
  "\u2514": {
    "\u2500": "\u2534",
    "\u2502": "\u251C",
    "\u250C": "\u251C",
    "\u2510": "\u253C",
    "\u2518": "\u2534",
    "\u251C": "\u251C",
    "\u2524": "\u253C",
    "\u252C": "\u253C",
    "\u2534": "\u2534"
  },
  "\u2518": {
    "\u2500": "\u2534",
    "\u2502": "\u2524",
    "\u250C": "\u253C",
    "\u2510": "\u2524",
    "\u2514": "\u2534",
    "\u251C": "\u253C",
    "\u2524": "\u2524",
    "\u252C": "\u253C",
    "\u2534": "\u2534"
  },
  "\u251C": {
    "\u2500": "\u253C",
    "\u2502": "\u251C",
    "\u250C": "\u251C",
    "\u2510": "\u253C",
    "\u2514": "\u251C",
    "\u2518": "\u253C",
    "\u2524": "\u253C",
    "\u252C": "\u253C",
    "\u2534": "\u253C"
  },
  "\u2524": {
    "\u2500": "\u253C",
    "\u2502": "\u2524",
    "\u250C": "\u253C",
    "\u2510": "\u2524",
    "\u2514": "\u253C",
    "\u2518": "\u2524",
    "\u251C": "\u253C",
    "\u252C": "\u253C",
    "\u2534": "\u253C"
  },
  "\u252C": {
    "\u2500": "\u252C",
    "\u2502": "\u253C",
    "\u250C": "\u252C",
    "\u2510": "\u252C",
    "\u2514": "\u253C",
    "\u2518": "\u253C",
    "\u251C": "\u253C",
    "\u2524": "\u253C",
    "\u2534": "\u253C"
  },
  "\u2534": {
    "\u2500": "\u2534",
    "\u2502": "\u253C",
    "\u250C": "\u253C",
    "\u2510": "\u253C",
    "\u2514": "\u2534",
    "\u2518": "\u2534",
    "\u251C": "\u253C",
    "\u2524": "\u253C",
    "\u252C": "\u253C"
  }
};
function Ve2(e2, t2) {
  return Be2[e2]?.[t2] ?? e2;
}
function He2(e2) {
  let t2 = /* @__PURE__ */ new Map(), n2 = [];
  for (let r of e2) {
    let [e3, i] = Fe2(r), a2 = W(r);
    for (let n3 = 0; n3 <= e3; n3++) for (let e4 = 0; e4 <= i; e4++) {
      let i2 = r[n3]?.[e4];
      if (i2 === void 0 || i2 === " ") continue;
      let o = `${n3},${e4}`, s = t2.get(o);
      if (s !== void 0) {
        if (!(s !== i2 && Re2(s) && Re2(i2))) continue;
      } else t2.set(o, i2);
      a2[n3][e4] = i2;
    }
    n2.push(a2);
  }
  return n2;
}
function Ue(e2, t2, n2, ...r) {
  let [i, a2] = Fe2(e2);
  for (let e3 of r) {
    let [n3, r2] = Fe2(e3);
    i = Math.max(i, n3 + t2.x), a2 = Math.max(a2, r2 + t2.y);
  }
  let o = U2(i, a2);
  for (let t3 = 0; t3 <= i; t3++) for (let n3 = 0; n3 <= a2; n3++) t3 < e2.length && n3 < (e2[0]?.length ?? 0) && (o[t3][n3] = e2[t3][n3]);
  for (let e3 of r) for (let r2 = 0; r2 < e3.length; r2++) for (let i2 = 0; i2 < (e3[0]?.length ?? 0); i2++) {
    let a3 = e3[r2][i2];
    if (a3 !== " ") {
      let e4 = r2 + t2.x, s = i2 + t2.y, c = o[e4][s];
      !n2 && Re2(a3) && Re2(c) ? o[e4][s] = Ve2(c, a3) : ze2(c) && ze2(a3) || (o[e4][s] = a3);
    }
  }
  return o;
}
function We(e2, t2) {
  let [n2, r] = Fe2(e2), i = [], a2 = t2?.roleCanvas, o = t2?.colorMode ?? "none", s = t2?.theme ?? z2, c = o === "html" ? void 0 : t2?.linkCanvas;
  for (let t3 = 0; t3 <= r; t3++) if (o === "none" || !a2) {
    let r2 = [];
    for (let i2 = 0; i2 <= n2; i2++) r2.push(e2[i2][t3]);
    if (c) {
      let e3 = r2.map((e4, n3) => c[n3]?.[t3] ?? null);
      i.push(R2(r2, e3));
    } else i.push(r2.join(""));
  } else {
    let r2 = [], l = [], u3 = [];
    for (let i2 = 0; i2 <= n2; i2++) r2.push(e2[i2][t3]), l.push(a2[i2]?.[t3] ?? null), u3.push(c?.[i2]?.[t3] ?? null);
    i.push(Ce3(r2, l, s, o, c ? u3 : void 0));
  }
  return i.join("\n");
}
var Ge = {
  "\u25B2": "\u25BC",
  "\u25BC": "\u25B2",
  "\u2196": "\u2199",
  "\u2199": "\u2196",
  "\u2197": "\u2198",
  "\u2198": "\u2197",
  "^": "v",
  v: "^",
  "\u250C": "\u2514",
  "\u2514": "\u250C",
  "\u2510": "\u2518",
  "\u2518": "\u2510",
  "\u252C": "\u2534",
  "\u2534": "\u252C",
  "\u256D": "\u2570",
  "\u2570": "\u256D",
  "\u256E": "\u256F",
  "\u256F": "\u256E",
  "\u2575": "\u2577",
  "\u2577": "\u2575"
};
function Ke(e2, t2) {
  for (let [n2, r] of e2.entries()) for (let [e3, i] of r.entries()) {
    if (t2?.[n2]?.[e3] === "text") continue;
    let a2 = Ge[i];
    a2 && (r[e3] = a2);
  }
  for (let t3 of e2) t3.reverse();
  return e2;
}
function qe(e2, t2, n2, r) {
  let i = [], a2 = /* @__PURE__ */ new Set();
  for (let { x0: e3, y0: r2, x1: o, y1: s } of n2) {
    if (r2 === s) continue;
    let n3 = [];
    for (let i2 = e3; i2 <= o; i2++) for (let e4 = r2; e4 <= s; e4++) {
      let r3 = `${i2},${e4}`;
      t2[i2]?.[e4] !== "text" || a2.has(r3) || (a2.add(r3), n3.push([i2, e4]));
    }
    i.push({
      cells: n3,
      ySum: r2 + s
    });
  }
  for (let { cells: n3, ySum: a3 } of i) Je(e2, n3, a3, " "), Je(t2, n3, a3, null), r && Je(r, n3, a3, null);
}
function Je(e2, t2, n2, r) {
  let i = t2.map(([t3, n3]) => e2[t3][n3]);
  for (let [n3, i2] of t2) e2[n3][i2] = r;
  for (let [r2, [a2, o]] of t2.entries()) e2[a2][n2 - o] = i[r2];
}
function Ye(e2) {
  for (let t2 of e2) t2.reverse();
  return e2;
}
var Xe = {
  "\u25BA": "\u25C4",
  "\u25C4": "\u25BA",
  ">": "<",
  "<": ">",
  "\u2196": "\u2197",
  "\u2197": "\u2196",
  "\u2199": "\u2198",
  "\u2198": "\u2199",
  "\u250C": "\u2510",
  "\u2510": "\u250C",
  "\u2514": "\u2518",
  "\u2518": "\u2514",
  "\u251C": "\u2524",
  "\u2524": "\u251C",
  "\u256D": "\u256E",
  "\u256E": "\u256D",
  "\u2570": "\u256F",
  "\u256F": "\u2570",
  "\u2554": "\u2557",
  "\u2557": "\u2554",
  "\u255A": "\u255D",
  "\u255D": "\u255A",
  "\u255F": "\u2562",
  "\u2562": "\u255F",
  "\u231C": "\u231D",
  "\u231D": "\u231C",
  "\u231E": "\u231F",
  "\u231F": "\u231E",
  "\u2571": "\u2572",
  "\u2572": "\u2571",
  "/": "\\",
  "\\": "/",
  "\u25E2": "\u25E3",
  "\u25E3": "\u25E2",
  "\u25E4": "\u25E5",
  "\u25E5": "\u25E4",
  "\u25F8": "\u25F9",
  "\u25F9": "\u25F8",
  "\u25FA": "\u25FF",
  "\u25FF": "\u25FA"
};
function Ze(e2, t2) {
  for (let [n2, r] of e2.entries()) for (let [e3, i] of r.entries()) {
    if (t2?.[n2]?.[e3] === "text") continue;
    let a2 = Xe[i];
    a2 && (r[e3] = a2);
  }
  return e2.reverse(), e2;
}
function Qe(e2, t2, n2, r) {
  let i = [], a2 = /* @__PURE__ */ new Set();
  for (let { x0: r2, y0: o, x1: s, y1: c } of n2) {
    if (r2 === s) continue;
    let n3 = [];
    for (let i2 = r2; i2 <= s; i2++) for (let r3 = o; r3 <= c; r3++) {
      let o2 = `${i2},${r3}`;
      t2[i2]?.[r3] !== "text" && e2[i2]?.[r3] !== "" || a2.has(o2) || (a2.add(o2), n3.push([i2, r3]));
    }
    i.push({
      cells: n3,
      xSum: r2 + s
    });
  }
  for (let { cells: n3, xSum: a3 } of i) $e(e2, n3, a3, " "), $e(t2, n3, a3, null), r && $e(r, n3, a3, null);
}
function $e(e2, t2, n2, r) {
  let i = t2.map(([t3, n3]) => e2[t3][n3]);
  for (let [n3, i2] of t2) e2[n3][i2] = r;
  for (let [r2, [a2, o]] of t2.entries()) e2[n2 - a2][o] = i[r2];
}
function et(e2) {
  return e2.reverse(), e2;
}
function tt(e2, t2, n2, r = false) {
  let i = je2(n2);
  Ie2(e2, t2.x + i.length, t2.y);
  for (let [n3, a2] of i.entries()) {
    let i2 = t2.x + n3, o = e2[i2][t2.y];
    (r || o === " ") && (e2[i2][t2.y] = a2);
  }
}
function nt(e2, t2, n2, r = 0, i = 0) {
  let a2 = r, o = i;
  for (let e3 of t2.values()) a2 += e3;
  for (let e3 of n2.values()) o += e3;
  Ie2(e2, a2 - 1, o - 1);
}
function rt(e2, t2, n2, r = 0, i = 0) {
  let a2 = r, o = i;
  for (let e3 of t2.values()) a2 += e3;
  for (let e3 of n2.values()) o += e3;
  Ne2(e2, a2 - 1, o - 1);
}
var it = 60;
var at = 20;
var ot = {
  hLine: "\u2500",
  vLine: "\u2502",
  origin: "\u253C",
  yTick: "\u2524",
  xTick: "\u252C",
  bar: "\u2588",
  grid: "\xB7",
  cornerTL: "\u256D",
  cornerTR: "\u256E",
  cornerBL: "\u2570",
  cornerBR: "\u256F"
};
var st = {
  hLine: "-",
  vLine: "|",
  origin: "+",
  yTick: "+",
  xTick: "+",
  bar: "#",
  grid: ".",
  cornerTL: "+",
  cornerTR: "+",
  cornerBL: "+",
  cornerBR: "+"
};
function ct(e2, t2) {
  let n2 = t2.accent ?? q2;
  return e2 <= 1 ? [n2] : Array.from({ length: e2 }, (e3, r) => Le(r, n2, t2.bg));
}
function lt(e2, t2) {
  switch (e2) {
    case "text":
      return t2.fg;
    case "border":
      return t2.border;
    case "line":
      return t2.line;
    case "arrow":
      return t2.arrow;
    case "corner":
      return t2.corner ?? t2.line;
    case "junction":
      return t2.junction ?? t2.border;
    default:
      return t2.fg;
  }
}
function ut(e2, t2, n2, r) {
  let i = _(e2), a2 = je(i), o = t2.useAscii ? st : ot;
  return a2.horizontal ? ft(a2, o, n2, r) : dt(a2, o, n2, r);
}
function dt(e2, t2, n2, r) {
  let i = wt(e2);
  if (i === 0) return "";
  let a2 = e2.yAxis.range;
  if (!a2)
    throw Error("XY chart: y-axis range was not set by the parser");
  let o = Et(a2.min, a2.max), s = Dt(o), c = Math.max(...s.map((e3) => e3.length)) + 1, l = Math.max(it, i * 6), u3 = at, d2 = Math.floor(l / i), f2 = Tt(e2, i), p3 = !!e2.title, m3 = !!e2.xAxis.title, h3 = !!e2.yAxis.title, g3 = e2.series.length > 1, _3 = p3 ? 0 : -1, v2 = (p3 ? 2 : 0) + +!!g3, y3 = h3 ? 2 : 0, b3 = y3 + c + 1, x3 = b3 + d2 * i + 2, S3 = v2 + u3, C3 = S3 + 1, ee3 = m3 ? C3 + 1 : -1, w2 = C3 + 1 + +!!m3 + 0, T3 = gt(x3, w2), E2 = _t(x3, w2), D3 = vt(x3, w2), O3 = ct(e2.series.length, r), k3 = (e3) => {
    let t3 = (e3 - a2.min) / (a2.max - a2.min || 1);
    return Math.round(t3 * 19);
  }, te3 = (e3) => b3 + Math.floor(d2 * (e3 + 0.5));
  e2.title && _3 >= 0 && xt(T3, E2, _3, Math.floor(x3 / 2 - e2.title.length / 2), e2.title, "text"), g3 && ht(T3, E2, D3, e2, +!!p3, x3, t2, O3);
  for (let e3 = 0; e3 < u3; e3++) yt(T3, E2, v2 + (19 - e3), b3 - 1, t2.vLine, "border");
  yt(T3, E2, S3, b3 - 1, t2.origin, "border");
  for (let [e3, n3] of o.entries()) {
    let r2 = k3(n3);
    if (r2 < 0 || r2 >= u3) continue;
    let i2 = v2 + (19 - r2), a3 = s[e3];
    yt(T3, E2, i2, b3 - 1, r2 === 0 ? t2.origin : t2.yTick, "border");
    let o2 = y3 + c - a3.length;
    xt(T3, E2, i2, Math.max(0, o2), a3, "text");
  }
  for (let e3 = b3; e3 < b3 + d2 * i; e3++) yt(T3, E2, S3, e3, t2.hLine, "border");
  for (let e3 = 0; e3 < i; e3++) {
    let n3 = te3(e3);
    yt(T3, E2, S3, n3, t2.xTick, "border");
    let r2 = f2[e3], i2 = n3 - Math.floor(r2.length / 2);
    xt(T3, E2, C3, Math.max(0, i2), r2, "text");
  }
  if (e2.xAxis.title && ee3 >= 0) {
    let t3 = e2.xAxis.title;
    xt(T3, E2, ee3, Math.floor(x3 / 2 - t3.length / 2), t3, "text");
  }
  if (e2.yAxis.title) {
    let t3 = e2.yAxis.title, n3 = v2 + Math.max(0, Math.floor((u3 - t3.length) / 2));
    for (let e3 = 0; e3 < t3.length; e3++) {
      let r2 = n3 + e3;
      if (r2 >= v2 + u3) break;
      yt(T3, E2, r2, 0, t3[e3], "text");
    }
  }
  for (let e3 of o) {
    let n3 = k3(e3);
    if (n3 < 0 || n3 >= u3) continue;
    let r2 = v2 + (19 - n3);
    for (let e4 = b3; e4 < b3 + d2 * i; e4++) bt(T3, r2, e4) === " " && yt(T3, E2, r2, e4, t2.grid, "line");
  }
  let ne3 = [];
  for (let t3 = 0; t3 < e2.series.length; t3++) e2.series[t3].type === "bar" && ne3.push({
    data: e2.series[t3].data,
    globalIdx: t3
  });
  if (ne3.length > 0) {
    let e3 = Math.max(1, d2 - 2), n3 = Math.max(1, Math.min(e3, 8)), r2 = k3(Math.max(0, a2.min));
    for (let e4 = 0; e4 < ne3.length; e4++) {
      let i2 = ne3[e4], a3 = O3[i2.globalIdx];
      for (let e5 = 0; e5 < i2.data.length; e5++) {
        let o2 = te3(e5) - Math.floor(n3 / 2), s2 = k3(i2.data[e5]), c2 = Math.min(r2, s2), l2 = Math.max(r2, s2);
        for (let e6 = c2; e6 <= l2; e6++) {
          let r3 = v2 + (19 - e6);
          for (let e7 = o2; e7 < o2 + n3; e7++) yt(T3, E2, r3, e7, t2.bar, "arrow", D3, a3);
        }
      }
    }
  }
  let A3 = [];
  for (let t3 = 0; t3 < e2.series.length; t3++) e2.series[t3].type === "line" && A3.push({
    data: e2.series[t3].data,
    globalIdx: t3
  });
  for (let e3 of A3) {
    if (e3.data.length === 0) continue;
    let n3 = O3[e3.globalIdx];
    pt(T3, E2, e3.data, te3, k3, v2, u3, b3, d2 * i, t2, D3, n3);
  }
  return St(T3, E2, D3, n2, r);
}
function ft(e2, t2, n2, r) {
  let i = wt(e2);
  if (i === 0) return "";
  let a2 = e2.yAxis.range;
  if (!a2)
    throw Error("XY chart: y-axis range was not set by the parser");
  let o = Et(a2.min, a2.max), s = Dt(o), c = Tt(e2, i), l = Math.max(...c.map((e3) => e3.length)) + 1, u3 = Math.max(it, 40), d2 = Math.max(2, Math.floor(at / i)), f2 = d2 * i, p3 = !!e2.title, m3 = !!e2.yAxis.title, h3 = e2.series.length > 1, g3 = (p3 ? 2 : 0) + +!!h3, _3 = l + 1, v2 = _3 + u3 + 2, y3 = g3 + f2 + 2 + +!!m3, b3 = g3 + f2, x3 = gt(v2, y3), S3 = _t(v2, y3), C3 = vt(v2, y3), ee3 = ct(e2.series.length, r), w2 = (e3) => {
    let t3 = (e3 - a2.min) / (a2.max - a2.min || 1);
    return _3 + Math.round(t3 * 59);
  }, T3 = (e3) => g3 + Math.floor(d2 * (e3 + 0.5));
  e2.title && xt(x3, S3, 0, Math.floor(v2 / 2 - e2.title.length / 2), e2.title, "text"), h3 && ht(x3, S3, C3, e2, +!!p3, v2, t2, ee3);
  for (let e3 = g3; e3 < g3 + f2; e3++) yt(x3, S3, e3, _3 - 1, t2.vLine, "border");
  yt(x3, S3, b3, _3 - 1, t2.origin, "border");
  for (let e3 = 0; e3 < i; e3++) {
    let t3 = T3(e3), n3 = c[e3], r2 = l - n3.length;
    xt(x3, S3, t3, Math.max(0, r2), n3, "text");
  }
  for (let e3 = _3; e3 < _3 + u3; e3++) yt(x3, S3, b3, e3, t2.hLine, "border");
  for (let [e3, n3] of o.entries()) {
    let r2 = w2(n3);
    if (r2 < _3 || r2 >= _3 + u3) continue;
    yt(x3, S3, b3, r2, t2.xTick, "border");
    let i2 = s[e3];
    xt(x3, S3, b3 + 1, r2 - Math.floor(i2.length / 2), i2, "text");
  }
  if (e2.yAxis.title) {
    let t3 = e2.yAxis.title;
    xt(x3, S3, y3 - 1, Math.floor(v2 / 2 - t3.length / 2), t3, "text");
  }
  for (let e3 of o) {
    let n3 = w2(e3);
    if (!(n3 < _3 || n3 >= _3 + u3)) for (let e4 = g3; e4 < g3 + f2; e4++) bt(x3, e4, n3) === " " && yt(x3, S3, e4, n3, t2.grid, "line");
  }
  let E2 = [];
  for (let t3 = 0; t3 < e2.series.length; t3++) e2.series[t3].type === "bar" && E2.push({
    data: e2.series[t3].data,
    globalIdx: t3
  });
  if (E2.length > 0) {
    let e3 = w2(Math.max(0, a2.min));
    for (let n3 = 0; n3 < E2.length; n3++) {
      let r2 = E2[n3], i2 = ee3[r2.globalIdx];
      for (let n4 = 0; n4 < r2.data.length; n4++) {
        let a3 = T3(n4), o2 = w2(r2.data[n4]), s2 = Math.min(e3, o2), c2 = Math.max(e3, o2);
        for (let e4 = a3; e4 < a3 + 1; e4++) for (let n5 = s2; n5 <= c2; n5++) yt(x3, S3, e4, n5, t2.bar, "arrow", C3, i2);
      }
    }
  }
  let D3 = [];
  for (let t3 = 0; t3 < e2.series.length; t3++) e2.series[t3].type === "line" && D3.push({
    data: e2.series[t3].data,
    globalIdx: t3
  });
  for (let e3 of D3) {
    if (e3.data.length === 0) continue;
    let n3 = ee3[e3.globalIdx];
    mt(x3, S3, e3.data, T3, w2, g3, f2, _3, u3, t2, C3, n3);
  }
  return St(x3, S3, C3, n2, r);
}
function pt(e2, t2, n2, r, i, a2, o, s, c, l, u3, d2) {
  if (n2.length === 0) return;
  let f2 = n2.map((e3, t3) => ({
    col: r(t3),
    row: i(e3)
  })), p3 = (n3, r2, i2) => {
    let l2 = a2 + (o - 1 - r2);
    l2 >= 0 && n3 >= s && n3 < s + c && yt(e2, t2, l2, n3, i2, "arrow", u3, d2);
  };
  if (f2.length === 1) {
    p3(f2[0].col, f2[0].row, l.hLine);
    return;
  }
  for (let e3 = 0; e3 < f2.length - 1; e3++) {
    let t3 = f2[e3], n3 = f2[e3 + 1];
    if (t3.row === n3.row) {
      for (let e4 = t3.col; e4 <= n3.col; e4++) p3(e4, t3.row, l.hLine);
      continue;
    }
    let r2 = Math.round((t3.col + n3.col) / 2), i2 = n3.row > t3.row;
    for (let e4 = t3.col; e4 < r2; e4++) p3(e4, t3.row, l.hLine);
    i2 ? p3(r2, t3.row, l.cornerBR) : p3(r2, t3.row, l.cornerTR);
    let a3 = Math.min(t3.row, n3.row), o2 = Math.max(t3.row, n3.row);
    for (let e4 = a3 + 1; e4 < o2; e4++) p3(r2, e4, l.vLine);
    i2 ? p3(r2, n3.row, l.cornerTL) : p3(r2, n3.row, l.cornerBL);
    for (let e4 = r2 + 1; e4 <= n3.col; e4++) p3(e4, n3.row, l.hLine);
    if (e3 === 0) {
      let e4 = Math.max(s, t3.col - Math.floor((n3.col - t3.col) / 4));
      for (let n4 = e4; n4 < t3.col; n4++) p3(n4, t3.row, l.hLine);
    }
    if (e3 === f2.length - 2) {
      let e4 = Math.min(s + c - 1, n3.col + Math.floor((n3.col - t3.col) / 4));
      for (let t4 = n3.col + 1; t4 <= e4; t4++) p3(t4, n3.row, l.hLine);
    }
  }
}
function mt(e2, t2, n2, r, i, a2, o, s, c, l, u3, d2) {
  if (n2.length === 0) return;
  let f2 = n2.map((e3, t3) => ({
    row: r(t3),
    col: i(e3)
  })), p3 = (n3, r2, i2) => {
    n3 >= a2 && n3 < a2 + o && r2 >= s && r2 < s + c && yt(e2, t2, n3, r2, i2, "arrow", u3, d2);
  };
  if (f2.length === 1) {
    p3(f2[0].row, f2[0].col, l.vLine);
    return;
  }
  for (let e3 = 0; e3 < f2.length - 1; e3++) {
    let t3 = f2[e3], n3 = f2[e3 + 1];
    if (t3.col === n3.col) {
      for (let e4 = t3.row; e4 <= n3.row; e4++) p3(e4, t3.col, l.vLine);
      continue;
    }
    let r2 = Math.round((t3.row + n3.row) / 2), i2 = n3.col > t3.col;
    for (let e4 = t3.row; e4 < r2; e4++) p3(e4, t3.col, l.vLine);
    i2 ? p3(r2, t3.col, l.cornerBL) : p3(r2, t3.col, l.cornerBR);
    let a3 = Math.min(t3.col, n3.col), o2 = Math.max(t3.col, n3.col);
    for (let e4 = a3 + 1; e4 < o2; e4++) p3(r2, e4, l.hLine);
    i2 ? p3(r2, n3.col, l.cornerTR) : p3(r2, n3.col, l.cornerTL);
    for (let e4 = r2 + 1; e4 <= n3.row; e4++) p3(e4, n3.col, l.vLine);
  }
}
function ht(e2, t2, n2, r, i, a2, o, s) {
  let c = [], l = 0, u3 = 0;
  for (let e3 = 0; e3 < r.series.length; e3++) r.series[e3].type === "bar" ? (c.push({
    symbol: o.bar,
    label: `Bar ${l + 1}`,
    globalIdx: e3
  }), l++) : (c.push({
    symbol: o.hLine,
    label: `Line ${u3 + 1}`,
    globalIdx: e3
  }), u3++);
  let d2 = 0;
  for (let e3 = 0; e3 < c.length; e3++) e3 > 0 && (d2 += 2), d2 += 2 + c[e3].label.length;
  let f2 = Math.max(0, Math.floor(a2 / 2 - d2 / 2));
  for (let r2 = 0; r2 < c.length; r2++) {
    r2 > 0 && (f2 += 2);
    let a3 = c[r2];
    yt(e2, t2, i, f2, a3.symbol, "arrow", n2, s[a3.globalIdx]), f2 += 1, f2 += 1, xt(e2, t2, i, f2, a3.label, "text"), f2 += a3.label.length;
  }
}
function gt(e2, t2) {
  return U2(e2 - 1, t2 - 1);
}
function _t(e2, t2) {
  return Me2(e2 - 1, t2 - 1);
}
function vt(e2, t2) {
  return Array.from({ length: e2 }, () => Array.from({ length: t2 }).fill(null));
}
function yt(e2, t2, n2, r, i, a2, o, s) {
  r >= 0 && r < e2.length && n2 >= 0 && n2 < (e2[0]?.length ?? 0) && (G(e2, r, n2, i, {
    role: a2,
    roleCanvas: t2
  }), o && s && (o[r][n2] = s));
}
function bt(e2, t2, n2) {
  return n2 >= 0 && n2 < e2.length && t2 >= 0 && t2 < e2[0].length ? e2[n2][t2] : " ";
}
function xt(e2, t2, n2, r, i, a2) {
  for (let o = 0; o < i.length; o++) yt(e2, t2, n2, r + o, i[o], a2);
}
function St(e2, t2, n2, r, i) {
  if (e2.length === 0) return "";
  let a2 = e2[0].length, o = e2.length, s = [];
  for (let c = 0; c < a2; c++) {
    let a3 = [], l = [], u3 = [];
    for (let r2 = 0; r2 < o; r2++) a3.push(e2[r2][c]), l.push(t2[r2][c]), u3.push(n2[r2][c]);
    let d2 = a3.length - 1;
    for (; d2 >= 0 && a3[d2] === " "; ) d2--;
    d2 < 0 ? s.push("") : s.push(Ct(a3.slice(0, d2 + 1), l.slice(0, d2 + 1), u3.slice(0, d2 + 1), i, r));
  }
  for (; s.length > 0 && s[s.length - 1] === ""; ) s.pop();
  return s.join("\n");
}
function Ct(e2, t2, n2, r, i) {
  if (i === "none") return e2.join("");
  let a2 = "", o = null, s = "";
  for (let c = 0; c < e2.length; c++) {
    let l = e2[c];
    if (l === " ") {
      s.length > 0 && (a2 += o ? Te2(s, o, i) : s, s = "", o = null), a2 += " ";
      continue;
    }
    let u3 = n2[c] ?? null, d2 = t2[c] ?? null, f2 = u3 ?? (d2 ? lt(d2, r) : null);
    f2 === o ? s += l : (s.length > 0 && (a2 += o ? Te2(s, o, i) : s), s = l, o = f2);
  }
  return s.length > 0 && (a2 += o ? Te2(s, o, i) : s), a2;
}
function wt(e2) {
  if (e2.xAxis.categories) return e2.xAxis.categories.length;
  for (let t2 of e2.series) if (t2.data.length > 0) return t2.data.length;
  return 0;
}
function Tt(e2, t2) {
  if (e2.xAxis.categories) return e2.xAxis.categories;
  if (e2.xAxis.range) {
    let { min: n2, max: r } = e2.xAxis.range, i = t2 > 1 ? (r - n2) / (t2 - 1) : 0;
    return Array.from({ length: t2 }, (e3, t3) => Ot(n2 + i * t3));
  }
  return Array.from({ length: t2 }, (e3, t3) => String(t3 + 1));
}
function Et(e2, t2) {
  let n2 = t2 - e2;
  if (n2 <= 0) return [e2];
  let r = n2 / 6, i = 10 ** Math.floor(Math.log10(r)), a2 = r / i, o;
  o = a2 <= 1.5 ? i : a2 <= 3 ? 2 * i : a2 <= 7 ? 5 * i : 10 * i;
  let s = Math.ceil(e2 / o) * o, c = [];
  for (let e3 = s; e3 <= t2 + o * 1e-3; e3 += o) c.push(Math.round(e3 * 1e10) / 1e10);
  return c;
}
function Dt(e2) {
  let t2 = e2.length > 1 ? Math.abs(e2[1] - e2[0]) : 0, n2 = t2 > 0 && t2 < 1 ? Math.ceil(-Math.log10(t2) - 1e-9) : 0;
  return e2.map((e3) => String(Number.isInteger(e3) && n2 === 0 ? e3 : Number(e3.toFixed(n2))));
}
function Ot(e2) {
  return Number.isInteger(e2) ? String(e2) : e2.toFixed(+(Math.abs(e2) < 10));
}
var K2 = {
  x: 1,
  y: 0
};
var q3 = {
  x: 1,
  y: 2
};
var J3 = {
  x: 0,
  y: 1
};
var Y2 = {
  x: 2,
  y: 1
};
var kt = {
  x: 2,
  y: 0
};
var At = {
  x: 0,
  y: 0
};
var jt = {
  x: 2,
  y: 2
};
var Mt = {
  x: 0,
  y: 2
};
var Nt = {
  x: 1,
  y: 1
};
function X2(e2, t2) {
  return e2.x === t2.x && e2.y === t2.y;
}
function Pt(e2) {
  return X2(e2, K2) || X2(e2, q3) || X2(e2, J3) || X2(e2, Y2);
}
function Ft(e2) {
  if (!Pt(e2)) throw Error(`Expected a cardinal direction (Up/Down/Left/Right); got {x:${e2.x}, y:${e2.y}}`);
  return e2;
}
function It(e2, t2, n2, r) {
  return Math.max(r, n2 + (e2 - t2));
}
function Lt(e2, t2) {
  return e2.x === t2.x && e2.y === t2.y;
}
function Rt(e2, t2) {
  return e2.x === t2.x && e2.y === t2.y;
}
function zt(e2, t2) {
  return {
    x: e2.x + t2.x,
    y: e2.y + t2.y
  };
}
function Bt(e2) {
  return `${e2.x},${e2.y}`;
}
function Z2(e2) {
  let t2 = e2.gridCoord;
  if (t2 === null)
    throw Error(`Node "${e2.name}" has no gridCoord; grid layout must run before it is read`);
  return t2;
}
var Vt = {
  name: "",
  styles: {}
};
var Ht = class {
  #e = /* @__PURE__ */ new Set();
  has(e2) {
    return this.#e.has(e2);
  }
  add(e2) {
    this.#e.add(e2);
  }
  delete(e2) {
    this.#e.delete(e2);
  }
  keys() {
    return this.#e.keys();
  }
};
function Ut() {
  return new Ht();
}
function Wt(e2) {
  let t2 = Ut();
  for (let n2 of e2.keys()) t2.add(n2);
  return t2;
}
function Gt(e2, t2) {
  return e2.has(Bt(t2));
}
function Kt(e2, t2) {
  return t2.x < 0 || t2.y < 0 ? false : !Gt(e2, t2);
}
function qt(e2, t2, n2 = 3) {
  for (let r = 0; r < n2; r++) for (let i = 0; i < n2; i++) if (Gt(e2, {
    x: t2.x + r,
    y: t2.y + i
  })) return false;
  return true;
}
function Jt(e2, t2, n2 = 3) {
  if (!qt(e2, t2, n2)) throw Error(`Grid block at (${t2.x},${t2.y}) is already occupied`);
  for (let r = 0; r < n2; r++) for (let i = 0; i < n2; i++) {
    let n3 = {
      x: t2.x + r,
      y: t2.y + i
    };
    e2.add(Bt(n3));
  }
}
var Yt = 1e5;
function Xt(e2) {
  if (e2.length === 0) return [];
  let t2 = [e2[0]];
  for (let n2 = 1; n2 < e2.length; n2++) {
    let r = e2[n2 - 1], i = e2[n2], a2 = r.x, o = r.y, s = Math.abs(i.x - r.x), c = Math.abs(i.y - r.y), l = r.x < i.x ? 1 : -1, u3 = r.y < i.y ? 1 : -1, d2 = s - c, f2 = 0;
    for (; a2 !== i.x || o !== i.y; ) {
      if (f2 >= Yt) throw Error(`pathCells: segment from (${r.x},${r.y}) to (${i.x},${i.y}) did not reach its endpoint within ${Yt} steps`);
      let e3 = 2 * d2;
      e3 > -c && (d2 -= c, a2 += l), e3 < s && (d2 += s, o += u3), t2.push({
        x: a2,
        y: o
      }), f2++;
    }
  }
  return t2;
}
var Zt = class {
  items = [];
  get length() {
    return this.items.length;
  }
  push(e2) {
    this.items.push(e2), this.bubbleUp(this.items.length - 1);
  }
  pop() {
    if (this.items.length === 0) return;
    let e2 = this.items[0], t2 = this.items.pop();
    return this.items.length > 0 && (this.items[0] = t2, this.sinkDown(0)), e2;
  }
  bubbleUp(e2) {
    let t2 = e2;
    for (; t2 > 0; ) {
      let e3 = t2 - 1 >> 1;
      if (this.items[t2].priority < this.items[e3].priority) [this.items[t2], this.items[e3]] = [this.items[e3], this.items[t2]], t2 = e3;
      else break;
    }
  }
  sinkDown(e2) {
    let t2 = this.items.length, n2 = e2;
    for (; ; ) {
      let e3 = n2, r = 2 * n2 + 1, i = 2 * n2 + 2;
      if (r < t2 && this.items[r].priority < this.items[e3].priority && (e3 = r), i < t2 && this.items[i].priority < this.items[e3].priority && (e3 = i), e3 !== n2) [this.items[n2], this.items[e3]] = [this.items[e3], this.items[n2]], n2 = e3;
      else break;
    }
  }
};
function Qt(e2, t2) {
  let n2 = Math.abs(e2.x - t2.x), r = Math.abs(e2.y - t2.y);
  return n2 === 0 || r === 0 ? n2 + r : n2 + r + 1;
}
var $t = 1e-3;
var en = [
  {
    x: 1,
    y: 0
  },
  {
    x: -1,
    y: 0
  },
  {
    x: 0,
    y: 1
  },
  {
    x: 0,
    y: -1
  }
];
var tn = 5e4;
var nn = 2e5;
function rn(e2 = nn) {
  return { remaining: e2 };
}
function an(e2, t2, n2, r, i = false) {
  if (r && r.remaining <= 0) return null;
  let a2 = new Zt();
  a2.push({
    coord: t2,
    priority: 0
  });
  let o = /* @__PURE__ */ new Map();
  o.set(Bt(t2), 0);
  let s = /* @__PURE__ */ new Map();
  s.set(Bt(t2), null);
  let c = 0;
  for (; a2.length > 0; ) {
    if (++c > tn) return null;
    if (r) {
      if (r.remaining <= 0) return null;
      r.remaining--;
    }
    let t3 = a2.pop().coord;
    if (Lt(t3, n2)) {
      let e3 = [], n3 = t3;
      for (; n3 !== null; ) e3.unshift(n3), n3 = s.get(Bt(n3)) ?? null;
      return e3;
    }
    let l = o.get(Bt(t3));
    if (l === void 0)
      throw Error(`A* pathfinding: missing cost for visited cell ${Bt(t3)}`);
    for (let r2 of en) {
      let c2 = {
        x: t3.x + r2.x,
        y: t3.y + r2.y
      };
      if (!Kt(e2, c2) && !Lt(c2, n2)) continue;
      let u3 = i ? s.get(Bt(t3)) : null, d2 = u3 && (t3.x - u3.x !== r2.x || t3.y - u3.y !== r2.y), f2 = l + 1 + (d2 ? $t : 0), p3 = Bt(c2), m3 = o.get(p3);
      if (m3 === void 0 || f2 < m3) {
        o.set(p3, f2);
        let e3 = f2 + Qt(c2, n2);
        a2.push({
          coord: c2,
          priority: e3
        }), s.set(p3, t3);
      }
    }
  }
  return null;
}
function on(e2) {
  if (e2.length <= 2) return e2;
  let t2 = /* @__PURE__ */ new Set(), n2 = e2[0], r = e2[1];
  for (let i = 2; i < e2.length; i++) {
    let a2 = e2[i], o = r.x - n2.x, s = r.y - n2.y, c = a2.x - r.x, l = a2.y - r.y;
    o === c && s === l && t2.add(i - 1), n2 = r, r = a2;
  }
  return e2.filter((e3, n3) => !t2.has(n3));
}
function sn(e2, t2, n2, r) {
  if (t2.x === n2.x && t2.y === n2.y) return true;
  let i = t2.x === n2.x;
  if (!i && t2.y !== n2.y) return false;
  let a2 = i ? n2.y > t2.y ? 1 : -1 : n2.x > t2.x ? 1 : -1, o = i ? t2.y : t2.x, s = i ? n2.y : n2.x;
  for (o += a2; ; o += a2) {
    let n3 = o === s, a3 = i ? {
      x: t2.x,
      y: o
    } : {
      x: o,
      y: t2.y
    };
    if (!(n3 && !r) && !Kt(e2, a3)) return false;
    if (n3) break;
  }
  return true;
}
function cn(e2, t2, n2, r) {
  let i = r ? {
    x: n2.x,
    y: t2.y
  } : {
    x: t2.x,
    y: n2.y
  };
  return !sn(e2, t2, i, true) || !sn(e2, i, n2, false) ? null : [
    t2,
    i,
    n2
  ];
}
function ln(e2, t2, n2, r) {
  if (t2.x === n2.x || t2.y === n2.y) return null;
  let i = X2(r, J3) || X2(r, Y2);
  return cn(e2.grid, t2, n2, i) ?? cn(e2.grid, t2, n2, !i);
}
function un(e2, t2, n2, r) {
  if (!e2.pathBudget) throw Error("routeEdge requires graph.pathBudget to be set; call createPathBudget() (see grid.ts createMapping) before routing edges");
  let i = ln(e2, t2, n2, r) ?? an(e2.grid, t2, n2, e2.pathBudget, e2.preferStraightRoutes === true);
  return i ? on(i) : null;
}
function dn(e2) {
  if (e2.config.graphDirection !== "TD") return [];
  let t2 = [], n2 = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Map();
  for (let t3 of e2.edges) {
    if (t3.from === t3.to) continue;
    let e3 = r.get(t3.to) ?? [];
    e3.push(t3), r.set(t3.to, e3);
  }
  for (let [i2, a2] of r) {
    if (a2.length < 2 || !fn(a2, e2) || a2.some((e3) => n2.has(e3))) continue;
    let r2 = {
      type: "fan-in",
      edges: [...a2],
      sharedNode: i2,
      otherNodes: a2.map((e3) => e3.from),
      junctionPoint: null,
      sharedPath: [],
      junctionDir: Nt,
      sharedNodeDir: Nt
    };
    for (let e3 of a2) e3.bundle = r2, n2.add(e3);
    t2.push(r2);
  }
  let i = /* @__PURE__ */ new Map();
  for (let t3 of e2.edges) {
    if (t3.from === t3.to || n2.has(t3)) continue;
    let e3 = i.get(t3.from) ?? [];
    e3.push(t3), i.set(t3.from, e3);
  }
  for (let [r2, a2] of i) {
    if (a2.length < 2 || !fn(a2, e2)) continue;
    let i2 = {
      type: "fan-out",
      edges: [...a2],
      sharedNode: r2,
      otherNodes: a2.map((e3) => e3.to),
      junctionPoint: null,
      sharedPath: [],
      junctionDir: Nt,
      sharedNodeDir: Nt
    };
    for (let e3 of a2) e3.bundle = i2, n2.add(e3);
    t2.push(i2);
  }
  return t2;
}
function fn(e2, t2) {
  if (e2.length < 2) return false;
  let n2 = e2[0].style, r = Pr(t2, e2[0].from), i = Pr(t2, e2[0].to);
  for (let a3 of e2) {
    if (a3.style !== n2 || a3.text.length > 0) return false;
    let e3 = Pr(t2, a3.from), o2 = Pr(t2, a3.to);
    if (e3 !== r || o2 !== i || e3 !== o2) return false;
  }
  let a2 = e2.every((t3) => t3.to === e2[0].to), o = a2 ? e2.map((e3) => e3.from) : e2.map((e3) => e3.to);
  if (new Set(o).size !== o.length || e2.some((e3) => e3.parallelLane)) return false;
  let s = t2.config.graphDirection === "LR" ? "x" : "y", c = (a2 ? e2[0].to : e2[0].from).gridCoord;
  if (!c) return false;
  for (let t3 of e2) {
    let e3 = (a2 ? t3.from : t3.to).gridCoord;
    if (!e3) return false;
    if (a2) {
      if (e3[s] >= c[s]) return false;
    } else if (e3[s] <= c[s]) return false;
  }
  return true;
}
function pn(e2, t2) {
  let n2 = e2.config.graphDirection, r = Z2(t2.sharedNode);
  if (t2.type === "fan-in") {
    if (n2 === "TD") {
      let e3 = r.y - 1;
      return {
        x: r.x + 1,
        y: e3
      };
    }
    return {
      x: r.x - 1,
      y: r.y + 1
    };
  }
  if (n2 === "TD") {
    let e3 = r.y + 3;
    return {
      x: r.x + 1,
      y: e3
    };
  }
  return {
    x: r.x + 3,
    y: r.y + 1
  };
}
function mn(e2, t2) {
  let n2 = e2.config.graphDirection;
  t2.junctionPoint = pn(e2, t2);
  let r = t2.junctionPoint;
  if (t2.type === "fan-in") {
    t2.junctionDir = n2 === "TD" ? K2 : J3, t2.sharedNodeDir = n2 === "TD" ? q3 : Y2;
    let i = Z2(t2.sharedNode), a2 = Ft(n2 === "TD" ? K2 : J3), o = zt(i, a2);
    t2.sharedPath = un(e2, r, o, a2) ?? [r, o];
    for (let i2 of t2.edges) {
      let o2 = Z2(i2.from), s = Ft(n2 === "TD" ? q3 : Y2), c = zt(o2, s);
      i2.pathToJunction = un(e2, c, r, s) ?? [c, r], i2.startDir = s, i2.endDir = a2, i2.path = [...i2.pathToJunction, ...t2.sharedPath.slice(1)];
    }
  } else {
    t2.junctionDir = n2 === "TD" ? q3 : Y2, t2.sharedNodeDir = n2 === "TD" ? K2 : J3;
    let i = Z2(t2.sharedNode), a2 = Ft(n2 === "TD" ? q3 : Y2), o = zt(i, a2);
    t2.sharedPath = un(e2, o, r, a2) ?? [o, r];
    for (let i2 of t2.edges) {
      let o2 = Z2(i2.to), s = Ft(n2 === "TD" ? K2 : J3), c = zt(o2, s);
      i2.pathToJunction = un(e2, r, c, s) ?? [r, c], i2.startDir = a2, i2.endDir = s, i2.path = [...t2.sharedPath, ...i2.pathToJunction.slice(1)];
    }
  }
}
function hn(e2) {
  for (let t2 of e2.bundles) mn(e2, t2);
}
function gn(e2) {
  let t2 = null;
  for (let n2 of e2.nodes) {
    let e3 = n2.gridCoord;
    if (e3) {
      if (!t2) {
        t2 = {
          minX: e3.x,
          minY: e3.y,
          maxX: e3.x + 2,
          maxY: e3.y + 2
        };
        continue;
      }
      t2.minX = Math.min(t2.minX, e3.x), t2.minY = Math.min(t2.minY, e3.y), t2.maxX = Math.max(t2.maxX, e3.x + 2), t2.maxY = Math.max(t2.maxY, e3.y + 2);
    }
  }
  return t2;
}
function _n(e2, t2, n2) {
  let r = e2.config.graphDirection !== "LR", i = r ? q3 : Y2, a2 = r ? K2 : J3, o = zt(Z2(t2.anchor), i), s = zt(Z2(n2.to), a2), c = un(e2, t2.gutter, s, Ft(r ? Y2 : q3));
  if (!c || c.length < 2) return null;
  let l = [o, ...c];
  return {
    path: l,
    startDir: i,
    endDir: a2,
    labelSegment: yn(t2) ? [l[l.length - 2], l[l.length - 1]] : [l[1], l[2]]
  };
}
function vn(e2, t2) {
  let n2 = t2.clusterTarget;
  if (!n2 || t2.bundle || t2.from === t2.to) return null;
  let r = gn(n2), i = t2.from.gridCoord;
  if (!r || !i || n2.nodes.includes(t2.from) || !n2.nodes.includes(t2.to)) return null;
  let a2 = e2.config.graphDirection !== "LR";
  if (a2 ? i.y + 2 >= r.minY - 1 : i.x + 2 >= r.minX - 1) return null;
  let o = (e3, t3, n3) => Math.min(Math.max(e3, t3), n3), s = a2 ? {
    x: o(i.x + 1, r.minX + 1, r.maxX - 1),
    y: r.minY - 1
  } : {
    x: r.minX - 1,
    y: o(i.y + 1, r.minY + 1, r.maxY - 1)
  };
  if (!Kt(e2.grid, s)) return null;
  let c = a2 ? q3 : Y2, l = a2 ? K2 : J3, u3 = un(e2, zt(i, c), s, Ft(c));
  return !u3 || u3.length < 2 ? null : {
    path: u3,
    startDir: c,
    endDir: l
  };
}
function yn(e2) {
  for (let t2 of e2.edges) if (t2.parallelLane) return true;
  return false;
}
function bn(e2) {
  let t2 = e2.config.graphDirection !== "LR", n2 = /* @__PURE__ */ new Map();
  for (let t3 of e2.edges) {
    let e3 = t3.clusterSource;
    if (!e3) continue;
    let r2 = n2.get(e3);
    r2 ? r2.push(t3) : n2.set(e3, [t3]);
  }
  let r = /* @__PURE__ */ new Map();
  for (let [i, a2] of n2) {
    let n3 = xn(e2, i, a2, t2);
    n3 && r.set(i, n3);
  }
  r.size > 0 && (e2.clusterExitPlans = r);
}
function xn(e2, t2, n2, r) {
  let i = gn(t2);
  if (!i) return null;
  let a2 = n2.filter((e3) => {
    let n3 = e3.from.gridCoord, a3 = e3.to.gridCoord;
    return !n3 || !a3 || e3.bundle || e3.from === e3.to || !t2.nodes.includes(e3.from) || t2.nodes.includes(e3.to) ? false : r ? a3.y > i.maxY + 1 : a3.x > i.maxX + 1;
  }), o = new Set(a2), s = /* @__PURE__ */ new Map();
  for (let t3 of e2.edges) {
    if (!t3.parallelLane) continue;
    let e3 = s.get(t3.parallelLane.usedOffsets);
    e3 ? e3.push(t3) : s.set(t3.parallelLane.usedOffsets, [t3]);
  }
  let c = a2.filter((e3) => !e3.parallelLane || s.get(e3.parallelLane.usedOffsets).every((e4) => o.has(e4)));
  if (c.length === 0) return null;
  let l = c[0].from;
  if (c.some((e3) => e3.from !== l)) return null;
  let u3 = Z2(l), d2 = r ? {
    x: u3.x + 1,
    y: i.maxY + 1
  } : {
    x: i.maxX + 1,
    y: u3.y + 1
  }, f2 = zt(u3, r ? q3 : Y2), p3 = {
    box: i,
    anchor: l,
    gutter: d2,
    edges: new Set(c)
  }, m3 = /* @__PURE__ */ new Set();
  for (let t3 of c) {
    let n3 = t3.parallelLane;
    n3 && n3.index > 0 && !Sn(e2, p3, t3) && m3.add(n3.usedOffsets);
  }
  if (c = c.filter((e3) => !e3.parallelLane || !m3.has(e3.parallelLane.usedOffsets)), new Set(c.map((e3) => e3.parallelLane?.usedOffsets ?? e3)).size < 2) return null;
  let h3 = r ? d2.y - f2.y : d2.x - f2.x;
  for (let t3 = 1; t3 <= h3; t3++) {
    let n3 = r ? {
      x: f2.x,
      y: f2.y + t3
    } : {
      x: f2.x + t3,
      y: f2.y
    };
    if (!Kt(e2.grid, n3)) return null;
  }
  let g3 = {
    box: i,
    anchor: l,
    gutter: d2,
    edges: new Set(c)
  };
  for (let t3 of c) if (!_n(e2, g3, t3)) return null;
  return g3;
}
function Sn(e2, t2, n2) {
  let r = e2.config.graphDirection !== "LR", i = n2.parallelLane.index;
  if (i > 2) return null;
  let a2 = Z2(n2.to), o = t2.gutter, s = r ? a2.x + 1 : a2.y + 1, c = r ? o.x : o.y, l = {
    lane: (r ? a2.x : a2.y) + 3,
    attach: (r ? a2.x : a2.y) + 2,
    dir: r ? J3 : K2
  }, u3 = {
    lane: (r ? a2.x : a2.y) - 1,
    attach: r ? a2.x : a2.y,
    dir: r ? Y2 : q3
  }, d2 = (c >= s ? [l, u3] : [u3, l])[i - 1];
  if (!(r ? e2.columnWidth : e2.rowHeight).has(d2.lane) || d2.lane < 0 || d2.lane === c) return null;
  let f2 = on(r ? [
    o,
    {
      x: d2.lane,
      y: o.y
    },
    {
      x: d2.lane,
      y: a2.y + 1
    },
    {
      x: d2.attach,
      y: a2.y + 1
    }
  ] : [
    o,
    {
      x: o.x,
      y: d2.lane
    },
    {
      x: a2.x + 1,
      y: d2.lane
    },
    {
      x: a2.x + 1,
      y: d2.attach
    }
  ]);
  if (!hi(e2, Xt(f2), [n2.from, n2.to])) return null;
  let p3 = r ? [{
    x: d2.lane,
    y: o.y
  }, {
    x: d2.lane,
    y: a2.y
  }] : [{
    x: o.x,
    y: d2.lane
  }, {
    x: a2.x,
    y: d2.lane
  }];
  return {
    path: f2,
    endDir: d2.dir,
    labelSegment: p3
  };
}
var Cn = 64;
function wn(e2) {
  let t2 = e2.clusterExitPlans;
  if (!t2) return false;
  let n2 = e2.config.graphDirection !== "LR", r = false, i = [...t2].sort(([e3], [t3]) => Tn(e3) - Tn(t3));
  for (let [t3, a2] of i) {
    let i2 = n2 ? t3.maxY : t3.maxX, o = n2 ? e2.rowHeight : e2.columnWidth, s = n2 ? a2.gutter.y : a2.gutter.x;
    for (let t4 = 0; t4 < Cn && !En(e2, a2, i2, n2); t4++) o.set(s, (o.get(s) ?? 0) + 1), r = true;
  }
  return r;
}
function Tn(e2) {
  let t2 = 0;
  for (let n2 = e2.parent; n2; n2 = n2.parent) t2++;
  return t2;
}
function En(e2, t2, n2, r) {
  let i = (e3) => r ? e3.y : e3.x;
  if (i($2(e2, t2.gutter)) <= n2) return false;
  for (let a2 of t2.edges) {
    let t3 = Ui(e2, a2), o = a2.path[a2.path.length - 1];
    if (!t3 || !o) continue;
    let s = i($2(e2, o)) - 1;
    for (let { x: e3, y: i2, text: a3 } of t3) {
      let t4 = r ? i2 : e3, o2 = r ? i2 : e3 + H2(a3) - 1;
      if (t4 <= n2 || o2 >= s) return false;
    }
  }
  return true;
}
function Q(e2) {
  return e2.split("\n");
}
function Dn(e2) {
  let t2 = Q(e2);
  return Math.max(...t2.map((e3) => H2(e3)), 0);
}
function On(e2) {
  return Q(e2).length;
}
function kn(e2, t2) {
  let n2 = e2.maxX - e2.minX, r = e2.maxY - e2.minY;
  if (n2 <= 0 || r <= 0) return U2(0, 0);
  let i = {
    x: 0,
    y: 0
  }, a2 = {
    x: n2,
    y: r
  }, o = U2(n2, r);
  if (t2.config.useAscii) {
    for (let e3 = i.x + 1; e3 < a2.x; e3++) G(o, e3, i.y, "-");
    for (let e3 = i.x + 1; e3 < a2.x; e3++) G(o, e3, a2.y, "-");
    for (let e3 = i.y + 1; e3 < a2.y; e3++) G(o, i.x, e3, "|");
    for (let e3 = i.y + 1; e3 < a2.y; e3++) G(o, a2.x, e3, "|");
    G(o, i.x, i.y, "+"), G(o, a2.x, i.y, "+"), G(o, i.x, a2.y, "+"), G(o, a2.x, a2.y, "+");
  } else {
    for (let e3 = i.x + 1; e3 < a2.x; e3++) G(o, e3, i.y, "\u2500");
    for (let e3 = i.x + 1; e3 < a2.x; e3++) G(o, e3, a2.y, "\u2500");
    for (let e3 = i.y + 1; e3 < a2.y; e3++) G(o, i.x, e3, "\u2502");
    for (let e3 = i.y + 1; e3 < a2.y; e3++) G(o, a2.x, e3, "\u2502");
    G(o, i.x, i.y, "\u250C"), G(o, a2.x, i.y, "\u2510"), G(o, i.x, a2.y, "\u2514"), G(o, a2.x, a2.y, "\u2518");
  }
  return o;
}
var An = /* @__PURE__ */ new Set([
  "\u2502",
  "\u2503",
  "\u2551",
  "\u2506",
  "\u250A",
  "|",
  ":",
  "\u2016",
  "\u253C",
  "\u254B"
]);
function jn(e2) {
  return e2 !== void 0 && An.has(e2);
}
function Mn(e2, t2, n2, r) {
  let i = (t3, i2) => {
    for (let a3 = t3 - i2; a3 < t3 + e2.length + i2; a3++) if (!(a3 < 1 || a3 >= n2) && r(a3)) return true;
    return false;
  };
  if (!i(t2, 1)) return t2;
  let a2 = Math.max(1, n2 - e2.length);
  for (let e3 of [1, 0]) {
    let n3 = -1;
    for (let r2 = 1; r2 <= a2; r2++) i(r2, e3) || (n3 < 0 || Math.abs(r2 - t2) < Math.abs(n3 - t2)) && (n3 = r2);
    if (n3 >= 0) return n3;
  }
  return null;
}
function Nn(e2, t2) {
  return Math.max(1, 1 + Math.ceil((t2 - 1 - e2.length) / 2));
}
function Pn(e2, t2, n2) {
  let r = je2(e2), i = Mn(r, Nn(r, t2), t2, n2);
  if (i === null || i + r.length >= t2) return false;
  for (let e3 = i - 1; e3 < i + r.length + 1; e3++) if (e3 >= 1 && e3 < t2 && n2(e3)) return false;
  return true;
}
function Fn(e2, t2, n2 = () => false) {
  let r = e2.maxX - e2.minX, i = e2.maxY - e2.minY;
  if (r <= 0 || i <= 0) return [
    U2(0, 0),
    {
      x: 0,
      y: 0
    },
    []
  ];
  let a2 = U2(r, i), o = [], s = Q(e2.name);
  for (let e3 = 0; e3 < s.length; e3++) {
    let t3 = s[e3], c = 1 + e3, l = 1 + Math.ceil((r - 1 - H2(t3)) / 2);
    l < 1 && (l = 1);
    let u3 = je2(t3);
    l = Mn(u3, l, r, (e4) => n2(e4, c)) ?? l;
    for (let e4 = 0; e4 < u3.length; e4++) l + e4 >= r || c >= i || u3[e4] === " " && n2(l + e4, c) || (G(a2, l + e4, c, u3[e4]), o.push({
      x: l + e4,
      y: c
    }));
  }
  return [
    a2,
    {
      x: e2.minX,
      y: e2.minY
    },
    o
  ];
}
var In = 16;
function Ln(e2, t2) {
  return e2.nodes.includes(t2.from) || e2.nodes.includes(t2.to);
}
function Rn(e2, t2) {
  let n2 = [], r = false;
  for (let i of e2.subgraphs) {
    if (Ln(i, t2)) continue;
    let a2 = gn(i);
    if (a2) {
      r = true;
      for (let t3 = a2.minX; t3 <= a2.maxX; t3++) for (let r2 = a2.minY; r2 <= a2.maxY; r2++) {
        let i2 = Bt({
          x: t3,
          y: r2
        });
        e2.grid.has(i2) || (e2.grid.add(i2), n2.push(i2));
      }
    }
  }
  return {
    added: n2,
    engaged: r
  };
}
function zn(e2, t2) {
  for (let n2 of t2) e2.grid.delete(n2);
}
function Bn(e2, t2, n2) {
  if (t2.size === 0) return false;
  let r = e2.config.graphDirection !== "LR", i = r ? e2.columnWidth : e2.rowHeight, a2 = false;
  for (let o = 0; o < In; o++) {
    let o2 = Vn(e2, t2, r);
    if (!o2) break;
    i.set(o2.index, (i.get(o2.index) ?? 0) + o2.by), a2 = true, n2();
  }
  return a2;
}
function Vn(e2, t2, n2) {
  for (let r of t2) {
    let t3 = r.path;
    for (let r2 = 1; r2 < t3.length; r2++) {
      let i = t3[r2 - 1], a2 = t3[r2];
      if (n2 ? i.x !== a2.x || i.y === a2.y : i.y !== a2.y || i.x === a2.x) continue;
      let o = n2 ? i.x : i.y, s = n2 ? $2(e2, i).x : $2(e2, i).y, c = n2 ? $2(e2, i).y : $2(e2, i).x, l = n2 ? $2(e2, a2).y : $2(e2, a2).x, u3 = Math.min(c, l), d2 = Math.max(c, l);
      for (let t4 of e2.subgraphs) {
        let e3 = gn(t4);
        if (!e3) continue;
        let r3 = n2 ? t4.minX : t4.minY, i2 = n2 ? t4.maxX : t4.maxY, a3 = n2 ? t4.minY : t4.minX, c2 = n2 ? t4.maxY : t4.maxX;
        if (d2 <= a3 || u3 >= c2) continue;
        let l2 = n2 ? e3.minX : e3.minY, f2 = n2 ? e3.maxX : e3.maxY;
        if (o > f2) {
          if (s > i2 + 1) continue;
          let e4 = i2 + 2 - s;
          return o - 1 > f2 ? {
            index: o - 1,
            by: e4
          } : {
            index: o,
            by: 2 * e4
          };
        }
        if (o < l2) {
          if (s < r3 - 1) continue;
          let e4 = s + 2 - r3;
          return o + 1 < l2 ? {
            index: o + 1,
            by: e4
          } : {
            index: o,
            by: 2 * e4
          };
        }
      }
    }
  }
  return null;
}
var Hn = 4;
function Un(e2, t2) {
  if (e2.config.graphDirection === "LR") return;
  let n2 = /* @__PURE__ */ new Set();
  for (let r = 0; r < e2.subgraphs.length; r++) {
    let r2 = e2.subgraphs.find((t3) => t3.nodes.length > 0 && !n2.has(t3) && Gn(e2, t3));
    if (!r2) return;
    let i = Wn(r2) + Hn;
    for (let a2 = 1; a2 <= i && (r2.titleRoom = a2, t2(), Gn(e2, r2)); a2++) a2 === i && (r2.titleRoom = 0, t2(), n2.add(r2));
  }
}
function Wn(e2) {
  return Math.max(0, ...Q(e2.name).map((e3) => H2(e3)));
}
function Gn(e2, t2) {
  let n2 = t2.maxX - t2.minX, r = Q(t2.name);
  for (let i = 0; i < r.length; i++) {
    let a2 = t2.minY + 1 + i, o = /* @__PURE__ */ new Set();
    for (let n3 of e2.edges) for (let r2 = 1; r2 < n3.path.length; r2++) {
      let i2 = n3.path[r2 - 1], s = n3.path[r2];
      if (i2.x !== s.x || i2.y === s.y) continue;
      let c = $2(e2, i2), l = $2(e2, s);
      a2 < Math.min(c.y, l.y) || a2 > Math.max(c.y, l.y) || c.x > t2.minX && c.x < t2.maxX && o.add(c.x - t2.minX);
    }
    if (o.size !== 0 && !Pn(r[i], n2, (e3) => o.has(e3))) return true;
  }
  return false;
}
function Kn() {
  return /* @__PURE__ */ new Map();
}
function qn(e2, t2, n2, r) {
  for (let i of Xt(n2)) {
    if (Gt(e2, i)) continue;
    let n3 = t2.get(Bt(i));
    if (n3 !== void 0 && n3 !== r) return i;
  }
  return null;
}
function Jn(e2, t2, n2, r) {
  for (let i of Xt(n2)) {
    if (Gt(e2, i)) continue;
    let n3 = Bt(i);
    t2.has(n3) || t2.set(n3, r);
  }
}
function Yn() {
  return /* @__PURE__ */ new Map();
}
function Xn(e2, t2) {
  return e2.to === t2.from || t2.to === e2.from;
}
var Zn = 2;
function Qn(e2, t2) {
  return t2(e2) ? 1 : Zn;
}
function $n(e2, t2, n2, r, i = () => false) {
  let a2 = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
  for (let i2 of Xt(n2)) {
    if (Gt(e2, i2)) continue;
    let n3 = t2.get(Bt(i2));
    if (n3 !== void 0) for (let e3 of n3) e3 !== r && Xn(e3, r) && (a2.set(e3, (a2.get(e3) ?? 0) + 1), o.has(e3) || o.set(e3, i2));
  }
  for (let [e3, t3] of a2) if (t3 >= Qn(e3, i)) return o.get(e3);
  return null;
}
function er(e2, t2, n2, r) {
  for (let i of Xt(n2)) {
    if (Gt(e2, i)) continue;
    let n3 = Bt(i), a2 = t2.get(n3);
    a2 === void 0 && (a2 = /* @__PURE__ */ new Set(), t2.set(n3, a2)), a2.add(r);
  }
}
var tr = {
  rectangle: {
    unicode: {
      tl: "\u250C",
      tr: "\u2510",
      bl: "\u2514",
      br: "\u2518"
    },
    ascii: {
      tl: "+",
      tr: "+",
      bl: "+",
      br: "+"
    }
  },
  rounded: {
    unicode: {
      tl: "\u256D",
      tr: "\u256E",
      bl: "\u2570",
      br: "\u256F"
    },
    ascii: {
      tl: ".",
      tr: ".",
      bl: "'",
      br: "'"
    }
  },
  circle: {
    unicode: {
      tl: "\u25EF",
      tr: "\u25EF",
      bl: "\u25EF",
      br: "\u25EF"
    },
    ascii: {
      tl: "o",
      tr: "o",
      bl: "o",
      br: "o"
    }
  },
  doublecircle: {
    unicode: {
      tl: "\u25CE",
      tr: "\u25CE",
      bl: "\u25CE",
      br: "\u25CE"
    },
    ascii: {
      tl: "@",
      tr: "@",
      bl: "@",
      br: "@"
    }
  },
  diamond: {
    unicode: {
      tl: "\u25C7",
      tr: "\u25C7",
      bl: "\u25C7",
      br: "\u25C7"
    },
    ascii: {
      tl: "<",
      tr: ">",
      bl: "<",
      br: ">"
    }
  },
  hexagon: {
    unicode: {
      tl: "\u231C",
      tr: "\u231D",
      bl: "\u231E",
      br: "\u231F"
    },
    ascii: {
      tl: "*",
      tr: "*",
      bl: "*",
      br: "*"
    }
  },
  stadium: {
    unicode: {
      tl: "(",
      tr: ")",
      bl: "(",
      br: ")"
    },
    ascii: {
      tl: "(",
      tr: ")",
      bl: "(",
      br: ")"
    }
  },
  subroutine: {
    unicode: {
      tl: "\u255F",
      tr: "\u2562",
      bl: "\u255F",
      br: "\u2562"
    },
    ascii: {
      tl: "|",
      tr: "|",
      bl: "|",
      br: "|"
    }
  },
  cylinder: {
    unicode: {
      tl: "\u256D",
      tr: "\u256E",
      bl: "\u2570",
      br: "\u256F"
    },
    ascii: {
      tl: ".",
      tr: ".",
      bl: "'",
      br: "'"
    }
  },
  asymmetric: {
    unicode: {
      tl: "\u25B7",
      tr: "\u2510",
      bl: "\u25B7",
      br: "\u2518"
    },
    ascii: {
      tl: ">",
      tr: "+",
      bl: ">",
      br: "+"
    }
  },
  trapezoid: {
    unicode: {
      tl: "/",
      tr: "\\",
      bl: "\u2514",
      br: "\u2518"
    },
    ascii: {
      tl: "/",
      tr: "\\",
      bl: "+",
      br: "+"
    }
  },
  "trapezoid-alt": {
    unicode: {
      tl: "\u250C",
      tr: "\u2510",
      bl: "\\",
      br: "/"
    },
    ascii: {
      tl: "+",
      tr: "+",
      bl: "\\",
      br: "/"
    }
  },
  parallelogram: {
    unicode: {
      tl: "/",
      tr: "/",
      bl: "/",
      br: "/"
    },
    ascii: {
      tl: "/",
      tr: "/",
      bl: "/",
      br: "/"
    }
  },
  "parallelogram-alt": {
    unicode: {
      tl: "\\",
      tr: "\\",
      bl: "\\",
      br: "\\"
    },
    ascii: {
      tl: "\\",
      tr: "\\",
      bl: "\\",
      br: "\\"
    }
  },
  "state-start": {
    unicode: {
      tl: "\u25CF",
      tr: "\u25CF",
      bl: "\u25CF",
      br: "\u25CF"
    },
    ascii: {
      tl: "*",
      tr: "*",
      bl: "*",
      br: "*"
    }
  },
  "state-end": {
    unicode: {
      tl: "\u25C9",
      tr: "\u25C9",
      bl: "\u25C9",
      br: "\u25C9"
    },
    ascii: {
      tl: "@",
      tr: "@",
      bl: "@",
      br: "@"
    }
  },
  document: {
    unicode: {
      tl: "\u250C",
      tr: "\u2510",
      bl: "\u2570",
      br: "\u256E"
    },
    ascii: {
      tl: "+",
      tr: "+",
      bl: "'",
      br: "~"
    }
  },
  "stacked-document": {
    unicode: {
      tl: "\u250C",
      tr: "\u2557",
      bl: "\u2570",
      br: "\u256E"
    },
    ascii: {
      tl: "+",
      tr: "#",
      bl: "'",
      br: "~"
    }
  },
  "stacked-process": {
    unicode: {
      tl: "\u250C",
      tr: "\u2557",
      bl: "\u2514",
      br: "\u255D"
    },
    ascii: {
      tl: "+",
      tr: "#",
      bl: "+",
      br: "#"
    }
  },
  card: {
    unicode: {
      tl: "\u2571",
      tr: "\u2510",
      bl: "\u2514",
      br: "\u2518"
    },
    ascii: {
      tl: "/",
      tr: "+",
      bl: "+",
      br: "+"
    }
  },
  "lined-process": {
    unicode: {
      tl: "\u250C",
      tr: "\u2510",
      bl: "\u2514",
      br: "\u2518"
    },
    ascii: {
      tl: "+",
      tr: "+",
      bl: "+",
      br: "+"
    }
  },
  "divided-process": {
    unicode: {
      tl: "\u250C",
      tr: "\u2510",
      bl: "\u2514",
      br: "\u2518"
    },
    ascii: {
      tl: "+",
      tr: "+",
      bl: "+",
      br: "+"
    }
  },
  "window-pane": {
    unicode: {
      tl: "\u250C",
      tr: "\u2510",
      bl: "\u2514",
      br: "\u2518"
    },
    ascii: {
      tl: "+",
      tr: "+",
      bl: "+",
      br: "+"
    }
  },
  triangle: {
    unicode: {
      tl: "\u2571",
      tr: "\u2572",
      bl: "\u2514",
      br: "\u2518"
    },
    ascii: {
      tl: "/",
      tr: "\\",
      bl: "+",
      br: "+"
    }
  },
  "flipped-triangle": {
    unicode: {
      tl: "\u250C",
      tr: "\u2510",
      bl: "\u2572",
      br: "\u2571"
    },
    ascii: {
      tl: "+",
      tr: "+",
      bl: "\\",
      br: "/"
    }
  },
  "filled-circle": {
    unicode: {
      tl: "\u25CF",
      tr: "\u25CF",
      bl: "\u25CF",
      br: "\u25CF"
    },
    ascii: {
      tl: "*",
      tr: "*",
      bl: "*",
      br: "*"
    }
  },
  "crossed-circle": {
    unicode: {
      tl: "\u2573",
      tr: "\u2573",
      bl: "\u2573",
      br: "\u2573"
    },
    ascii: {
      tl: "X",
      tr: "X",
      bl: "X",
      br: "X"
    }
  },
  "fork-join": {
    unicode: {
      tl: "\u2501",
      tr: "\u2501",
      bl: "\u2501",
      br: "\u2501"
    },
    ascii: {
      tl: "=",
      tr: "=",
      bl: "=",
      br: "="
    }
  },
  "notched-pentagon": {
    unicode: {
      tl: "\u2571",
      tr: "\u2572",
      bl: "\u2514",
      br: "\u2518"
    },
    ascii: {
      tl: "/",
      tr: "\\",
      bl: "+",
      br: "+"
    }
  },
  "sloped-rectangle": {
    unicode: {
      tl: "\u2571",
      tr: "\u2510",
      bl: "\u2514",
      br: "\u2518"
    },
    ascii: {
      tl: "/",
      tr: "+",
      bl: "+",
      br: "+"
    }
  },
  flag: {
    unicode: {
      tl: "\u256D",
      tr: "\u256E",
      bl: "\u2570",
      br: "\u256F"
    },
    ascii: {
      tl: "~",
      tr: "~",
      bl: "~",
      br: "~"
    }
  },
  "bow-tie-rectangle": {
    unicode: {
      tl: "\u2572",
      tr: "\u2571",
      bl: "\u2571",
      br: "\u2572"
    },
    ascii: {
      tl: "\\",
      tr: "/",
      bl: "/",
      br: "\\"
    }
  },
  "half-rounded-rectangle": {
    unicode: {
      tl: "\u250C",
      tr: "\u256E",
      bl: "\u2514",
      br: "\u256F"
    },
    ascii: {
      tl: "+",
      tr: ".",
      bl: "+",
      br: "'"
    }
  },
  brace: {
    unicode: {
      tl: "\u256D",
      tr: "\u2510",
      bl: "\u2570",
      br: "\u2518"
    },
    ascii: {
      tl: "{",
      tr: "+",
      bl: "{",
      br: "+"
    }
  },
  "brace-right": {
    unicode: {
      tl: "\u250C",
      tr: "\u256E",
      bl: "\u2514",
      br: "\u256F"
    },
    ascii: {
      tl: "+",
      tr: "}",
      bl: "+",
      br: "}"
    }
  },
  braces: {
    unicode: {
      tl: "\u256D",
      tr: "\u256E",
      bl: "\u2570",
      br: "\u256F"
    },
    ascii: {
      tl: "{",
      tr: "}",
      bl: "{",
      br: "}"
    }
  },
  bolt: {
    unicode: {
      tl: "\u2571",
      tr: "\u2572",
      bl: "\u2572",
      br: "\u2571"
    },
    ascii: {
      tl: "/",
      tr: "\\",
      bl: "\\",
      br: "/"
    }
  },
  text: {
    unicode: {
      tl: " ",
      tr: " ",
      bl: " ",
      br: " "
    },
    ascii: {
      tl: " ",
      tr: " ",
      bl: " ",
      br: " "
    }
  },
  anchor: {
    unicode: {
      tl: " ",
      tr: " ",
      bl: " ",
      br: " "
    },
    ascii: {
      tl: " ",
      tr: " ",
      bl: " ",
      br: " "
    }
  }
};
function nr(e2, t2) {
  let n2 = tr[e2] ?? tr.rectangle;
  return t2 ? n2.ascii : n2.unicode;
}
function rr(e2, t2) {
  let n2 = Q(e2), r = Math.max(...n2.map((e3) => H2(e3)), 0), i = n2.length, a2 = 2 * t2.padding + r, o = a2 + 2, s = i + 2 * t2.padding, c = s % 2 == 0 ? s + 1 : s;
  return {
    width: o,
    height: c + 2,
    labelArea: {
      x: 1 + t2.padding,
      y: 1 + t2.padding,
      width: r,
      height: i
    },
    gridColumns: [
      1,
      a2,
      1
    ],
    gridRows: [
      1,
      c,
      1
    ]
  };
}
function ir(e2, t2, n2, r) {
  let { width: i, height: a2 } = t2, o = U2(i - 1, a2 - 1), s = {
    x: 0,
    y: 0
  }, c = {
    x: i - 1,
    y: a2 - 1
  }, l = r ? "-" : "\u2500", u3 = r ? "|" : "\u2502";
  for (let e3 = s.x + 1; e3 < c.x; e3++) o[e3][s.y] = l, o[e3][c.y] = l;
  for (let e3 = s.y + 1; e3 < c.y; e3++) o[s.x][e3] = u3, o[c.x][e3] = u3;
  o[s.x][s.y] = n2.tl, o[c.x][s.y] = n2.tr, o[s.x][c.y] = n2.bl, o[c.x][c.y] = n2.br;
  let d2 = Q(e2), f2 = i - 1, p3 = a2 - 1, m3 = Math.floor(p3 / 2) - Math.floor((d2.length - 1) / 2);
  for (let e3 = 0; e3 < d2.length; e3++) {
    let t3 = d2[e3], n3 = Math.floor(f2 / 2) - Math.ceil(H2(t3) / 2) + 1, r2 = je2(t3);
    for (let t4 = 0; t4 < r2.length; t4++) {
      let i2 = n3 + t4, a3 = m3 + e3;
      i2 >= 0 && i2 < o.length && a3 >= 0 && a3 < o[0].length && (o[i2][a3] = r2[t4]);
    }
  }
  return o;
}
function ar(e2, t2, n2) {
  let { width: r, height: i } = t2, a2 = n2.x + Math.floor(r / 2), o = n2.y + Math.floor(i / 2);
  return X2(e2, K2) ? {
    x: a2,
    y: n2.y
  } : X2(e2, q3) ? {
    x: a2,
    y: n2.y + i - 1
  } : X2(e2, J3) ? {
    x: n2.x,
    y: o
  } : X2(e2, Y2) ? {
    x: n2.x + r - 1,
    y: o
  } : X2(e2, At) ? {
    x: n2.x,
    y: n2.y
  } : X2(e2, kt) ? {
    x: n2.x + r - 1,
    y: n2.y
  } : X2(e2, Mt) ? {
    x: n2.x,
    y: n2.y + i - 1
  } : X2(e2, jt) ? {
    x: n2.x + r - 1,
    y: n2.y + i - 1
  } : {
    x: a2,
    y: o
  };
}
var or = {
  getDimensions: rr,
  render(e2, t2, n2) {
    return ir(e2, t2, nr("rectangle", n2.useAscii), n2.useAscii);
  },
  getAttachmentPoint: ar
};
var sr = {
  getDimensions(e2, t2) {
    return {
      width: 5,
      height: 3,
      labelArea: {
        x: 2,
        y: 1,
        width: 1,
        height: 1
      },
      gridColumns: [
        1,
        3,
        1
      ],
      gridRows: [
        1,
        1,
        1
      ]
    };
  },
  render(e2, t2, n2) {
    let { width: r, height: i } = t2, a2 = U2(r - 1, i - 1), o = Math.floor(r / 2);
    return n2.useAscii ? (a2[0][0] = ".", a2[1][0] = "-", a2[2][0] = "-", a2[3][0] = "-", a2[4][0] = ".", a2[0][1] = "|", a2[o][1] = "*", a2[4][1] = "|", a2[0][2] = "'", a2[1][2] = "-", a2[2][2] = "-", a2[3][2] = "-", a2[4][2] = "'") : (a2[0][0] = "\u256D", a2[1][0] = "\u2500", a2[2][0] = "\u2500", a2[3][0] = "\u2500", a2[4][0] = "\u256E", a2[0][1] = "\u2502", a2[o][1] = "\u25CF", a2[4][1] = "\u2502", a2[0][2] = "\u2570", a2[1][2] = "\u2500", a2[2][2] = "\u2500", a2[3][2] = "\u2500", a2[4][2] = "\u256F"), a2;
  },
  getAttachmentPoint(e2, t2, n2) {
    let { width: r, height: i } = t2, a2 = n2.x + Math.floor(r / 2), o = n2.y + Math.floor(i / 2);
    return X2(e2, K2) ? {
      x: a2,
      y: n2.y
    } : X2(e2, q3) ? {
      x: a2,
      y: n2.y + i - 1
    } : X2(e2, J3) ? {
      x: n2.x,
      y: o
    } : X2(e2, Y2) ? {
      x: n2.x + r - 1,
      y: o
    } : {
      x: a2,
      y: o
    };
  }
};
var cr = {
  getDimensions(e2, t2) {
    return {
      width: 5,
      height: 3,
      labelArea: {
        x: 2,
        y: 1,
        width: 1,
        height: 1
      },
      gridColumns: [
        1,
        3,
        1
      ],
      gridRows: [
        1,
        1,
        1
      ]
    };
  },
  render(e2, t2, n2) {
    let { width: r, height: i } = t2, a2 = U2(r - 1, i - 1), o = Math.floor(r / 2);
    return n2.useAscii ? (a2[0][0] = "#", a2[1][0] = "=", a2[2][0] = "=", a2[3][0] = "=", a2[4][0] = "#", a2[0][1] = "#", a2[o][1] = "*", a2[4][1] = "#", a2[0][2] = "#", a2[1][2] = "=", a2[2][2] = "=", a2[3][2] = "=", a2[4][2] = "#") : (a2[0][0] = "\u2554", a2[1][0] = "\u2550", a2[2][0] = "\u2550", a2[3][0] = "\u2550", a2[4][0] = "\u2557", a2[0][1] = "\u2551", a2[o][1] = "\u25CE", a2[4][1] = "\u2551", a2[0][2] = "\u255A", a2[1][2] = "\u2550", a2[2][2] = "\u2550", a2[3][2] = "\u2550", a2[4][2] = "\u255D"), a2;
  },
  getAttachmentPoint(e2, t2, n2) {
    let { width: r, height: i } = t2, a2 = n2.x + Math.floor(r / 2), o = n2.y + Math.floor(i / 2);
    return X2(e2, K2) ? {
      x: a2,
      y: n2.y
    } : X2(e2, q3) ? {
      x: a2,
      y: n2.y + i - 1
    } : X2(e2, J3) ? {
      x: n2.x,
      y: o
    } : X2(e2, Y2) ? {
      x: n2.x + r - 1,
      y: o
    } : {
      x: a2,
      y: o
    };
  }
};
var lr = {
  getDimensions(e2, t2) {
    let n2 = Q(e2), r = Math.max(...n2.map((e3) => H2(e3)), 0), i = n2.length, a2 = 2 * t2.padding + r, o = a2 + 4, s = i + 2 * t2.padding;
    return {
      width: o,
      height: Math.max(s + 2, 3),
      labelArea: {
        x: 2 + t2.padding,
        y: 1 + t2.padding,
        width: r,
        height: i
      },
      gridColumns: [
        2,
        a2,
        2
      ],
      gridRows: [
        1,
        s,
        1
      ]
    };
  },
  render(e2, t2, n2) {
    let { width: r, height: i } = t2, a2 = U2(r - 1, i - 1), o = Math.floor(i / 2), s = n2.useAscii ? "-" : "\u2500";
    if (i === 3) a2[0][o] = "(", a2[r - 1][o] = ")";
    else if (n2.useAscii) {
      for (let e3 = 0; e3 < i; e3++) a2[0][e3] = "(", a2[r - 1][e3] = ")";
      for (let e3 = 1; e3 < r - 1; e3++) a2[e3][0] = s, a2[e3][i - 1] = s;
    } else {
      a2[0][0] = "\u256D";
      for (let e3 = 1; e3 < r - 1; e3++) a2[e3][0] = s;
      a2[r - 1][0] = "\u256E";
      for (let e3 = 1; e3 < i - 1; e3++) a2[0][e3] = "\u2502", a2[r - 1][e3] = "\u2502";
      a2[0][i - 1] = "\u2570";
      for (let e3 = 1; e3 < r - 1; e3++) a2[e3][i - 1] = s;
      a2[r - 1][i - 1] = "\u256F";
    }
    let c = Q(e2), l = o - Math.floor((c.length - 1) / 2);
    for (let e3 = 0; e3 < c.length; e3++) {
      let t3 = c[e3], n3 = Math.floor(r / 2) - Math.floor(H2(t3) / 2), o2 = je2(t3);
      for (let t4 = 0; t4 < o2.length; t4++) {
        let s2 = n3 + t4, c2 = l + e3;
        s2 > 0 && s2 < r - 1 && c2 >= 0 && c2 < i && (a2[s2][c2] = o2[t4]);
      }
    }
    return a2;
  },
  getAttachmentPoint: ar
};
var ur = {
  getDimensions(e2, t2) {
    let n2 = Q(e2), r = Math.max(...n2.map((e3) => H2(e3)), 0), i = n2.length, a2 = 2 * t2.padding + r, o = a2 + 4, s = i + 2 * t2.padding;
    return {
      width: o,
      height: s + 2,
      labelArea: {
        x: 2 + t2.padding,
        y: 1 + t2.padding,
        width: r,
        height: i
      },
      gridColumns: [
        2,
        a2,
        2
      ],
      gridRows: [
        1,
        s,
        1
      ]
    };
  },
  render(e2, t2, n2) {
    let { width: r, height: i } = t2, a2 = U2(r - 1, i - 1), o = n2.useAscii ? "-" : "\u2500", s = n2.useAscii ? "|" : "\u2502";
    a2[0][0] = n2.useAscii ? "+" : "\u250C", a2[1][0] = n2.useAscii ? "+" : "\u252C";
    for (let e3 = 2; e3 < r - 2; e3++) a2[e3][0] = o;
    a2[r - 2][0] = n2.useAscii ? "+" : "\u252C", a2[r - 1][0] = n2.useAscii ? "+" : "\u2510";
    for (let e3 = 1; e3 < i - 1; e3++) a2[0][e3] = s, a2[1][e3] = s, a2[r - 2][e3] = s, a2[r - 1][e3] = s;
    a2[0][i - 1] = n2.useAscii ? "+" : "\u2514", a2[1][i - 1] = n2.useAscii ? "+" : "\u2534";
    for (let e3 = 2; e3 < r - 2; e3++) a2[e3][i - 1] = o;
    a2[r - 2][i - 1] = n2.useAscii ? "+" : "\u2534", a2[r - 1][i - 1] = n2.useAscii ? "+" : "\u2518";
    let c = Q(e2), l = Math.floor(i / 2) - Math.floor((c.length - 1) / 2);
    for (let e3 = 0; e3 < c.length; e3++) {
      let t3 = c[e3], n3 = Math.floor(r / 2) - Math.floor(H2(t3) / 2), o2 = je2(t3);
      for (let t4 = 0; t4 < o2.length; t4++) {
        let s2 = n3 + t4, c2 = l + e3;
        s2 > 1 && s2 < r - 2 && c2 > 0 && c2 < i - 1 && (a2[s2][c2] = o2[t4]);
      }
    }
    return a2;
  },
  getAttachmentPoint: ar
};
var dr = {
  getDimensions: rr,
  render(e2, t2, n2) {
    return ir(e2, t2, nr("doublecircle", n2.useAscii), n2.useAscii);
  },
  getAttachmentPoint: ar
};
var fr = {
  getDimensions(e2, t2) {
    let n2 = Q(e2), r = Math.max(...n2.map((e3) => H2(e3)), 0), i = n2.length, a2 = 2 * t2.padding + r, o = a2 + 2, s = i + 2 * t2.padding + 2;
    return {
      width: o,
      height: s + 2,
      labelArea: {
        x: 1 + t2.padding,
        y: 2 + t2.padding,
        width: r,
        height: i
      },
      gridColumns: [
        1,
        a2,
        1
      ],
      gridRows: [
        2,
        s - 2,
        2
      ]
    };
  },
  render(e2, t2, n2) {
    let { width: r, height: i } = t2, a2 = U2(r - 1, i - 1), o = n2.useAscii ? "-" : "\u2500", s = n2.useAscii ? "|" : "\u2502";
    a2[0][0] = n2.useAscii ? "." : "\u256D";
    for (let e3 = 1; e3 < r - 1; e3++) a2[e3][0] = o;
    a2[r - 1][0] = n2.useAscii ? "." : "\u256E", a2[0][1] = s;
    for (let e3 = 1; e3 < r - 1; e3++) a2[e3][1] = o;
    a2[r - 1][1] = s;
    for (let e3 = 2; e3 < i - 2; e3++) a2[0][e3] = s, a2[r - 1][e3] = s;
    a2[0][i - 2] = s;
    for (let e3 = 1; e3 < r - 1; e3++) a2[e3][i - 2] = o;
    a2[r - 1][i - 2] = s, a2[0][i - 1] = n2.useAscii ? "'" : "\u2570";
    for (let e3 = 1; e3 < r - 1; e3++) a2[e3][i - 1] = o;
    a2[r - 1][i - 1] = n2.useAscii ? "'" : "\u256F";
    let c = Q(e2), l = Math.floor(i / 2) - Math.floor((c.length - 1) / 2);
    for (let e3 = 0; e3 < c.length; e3++) {
      let t3 = c[e3], n3 = Math.floor(r / 2) - Math.floor(H2(t3) / 2), o2 = je2(t3);
      for (let t4 = 0; t4 < o2.length; t4++) {
        let s2 = n3 + t4, c2 = l + e3;
        s2 > 0 && s2 < r - 1 && c2 > 1 && c2 < i - 2 && (a2[s2][c2] = o2[t4]);
      }
    }
    return a2;
  },
  getAttachmentPoint: ar
};
var pr = {
  getDimensions: rr,
  render(e2, t2, n2) {
    return ir(e2, t2, nr("asymmetric", n2.useAscii), n2.useAscii);
  },
  getAttachmentPoint: ar
};
var mr = {
  getDimensions: rr,
  render(e2, t2, n2) {
    return ir(e2, t2, nr("trapezoid", n2.useAscii), n2.useAscii);
  },
  getAttachmentPoint: ar
};
var hr = {
  getDimensions: rr,
  render(e2, t2, n2) {
    return ir(e2, t2, nr("trapezoid-alt", n2.useAscii), n2.useAscii);
  },
  getAttachmentPoint: ar
};
var gr = {
  getDimensions: rr,
  render(e2, t2, n2) {
    return ir(e2, t2, nr("parallelogram", n2.useAscii), n2.useAscii);
  },
  getAttachmentPoint: ar
};
var _r = {
  getDimensions: rr,
  render(e2, t2, n2) {
    return ir(e2, t2, nr("parallelogram-alt", n2.useAscii), n2.useAscii);
  },
  getAttachmentPoint: ar
};
function vr(e2) {
  return {
    getDimensions: rr,
    render(t2, n2, r) {
      return ir(t2, n2, nr(e2, r.useAscii), r.useAscii);
    },
    getAttachmentPoint: ar
  };
}
var yr = vr("circle");
var br = vr("diamond");
var xr = vr("rounded");
var Sr = vr("hexagon");
var Cr = /* @__PURE__ */ new Map([
  ["rectangle", or],
  ["rounded", xr],
  ["diamond", br],
  ["stadium", lr],
  ["circle", yr],
  ["subroutine", ur],
  ["doublecircle", dr],
  ["hexagon", Sr],
  ["cylinder", fr],
  ["asymmetric", pr],
  ["trapezoid", mr],
  ["trapezoid-alt", hr],
  ["parallelogram", gr],
  ["parallelogram-alt", _r],
  ["state-start", sr],
  ["state-end", cr]
]);
function wr(e2) {
  return Cr.get(e2) ?? or;
}
function Tr(e2, t2, n2) {
  return wr(e2).getDimensions(t2, n2);
}
function Er(e2, t2, n2, r) {
  return wr(e2).getAttachmentPoint(t2, n2, r);
}
function $2(e2, t2, n2) {
  let r = n2 ? {
    x: t2.x + n2.x,
    y: t2.y + n2.y
  } : t2, i = 0;
  for (let t3 = 0; t3 < r.x; t3++) i += e2.columnWidth.get(t3) ?? 0;
  let a2 = 0;
  for (let t3 = 0; t3 < r.y; t3++) a2 += e2.rowHeight.get(t3) ?? 0;
  let o = e2.columnWidth.get(r.x) ?? 0, s = e2.rowHeight.get(r.y) ?? 0;
  return {
    x: i + Math.floor(o / 2) + e2.offsetX,
    y: a2 + Math.floor(s / 2) + e2.offsetY
  };
}
function Dr(e2, t2) {
  return t2.map((t3) => $2(e2, t3));
}
function Or(e2, t2, n2, r) {
  let i = r ?? zr(e2, t2);
  return qt(e2.grid, n2, 3) ? (Jt(e2.grid, n2, 3), t2.gridCoord = n2, n2) : i === "LR" ? Or(e2, t2, {
    x: n2.x,
    y: n2.y + 4
  }, i) : Or(e2, t2, {
    x: n2.x + 4,
    y: n2.y
  }, i);
}
function kr(e2, t2) {
  let n2 = Z2(t2), r = e2.config.boxBorderPadding, i = Tr(t2.shape, t2.displayLabel, {
    useAscii: e2.config.useAscii,
    padding: r
  }), a2 = i.gridColumns, o = i.gridRows;
  for (let t3 = 0; t3 < a2.length; t3++) {
    let r2 = n2.x + t3, i2 = e2.columnWidth.get(r2) ?? 0;
    e2.columnWidth.set(r2, Math.max(i2, a2[t3]));
  }
  for (let t3 = 0; t3 < o.length; t3++) {
    let r2 = n2.y + t3, i2 = e2.rowHeight.get(r2) ?? 0;
    e2.rowHeight.set(r2, Math.max(i2, o[t3]));
  }
  if (n2.x > 0) {
    let t3 = e2.columnWidth.get(n2.x - 1) ?? 0;
    e2.columnWidth.set(n2.x - 1, Math.max(t3, e2.config.paddingX));
  }
  if (n2.y > 0) {
    let r2 = e2.config.paddingY;
    Br(e2, t2) && (r2 += 4);
    let i2 = e2.rowHeight.get(n2.y - 1) ?? 0;
    e2.rowHeight.set(n2.y - 1, Math.max(i2, r2));
  }
}
function Ar(e2, t2) {
  for (let n2 of t2) e2.columnWidth.has(n2.x) || e2.columnWidth.set(n2.x, Math.floor(e2.config.paddingX / 2)), e2.rowHeight.has(n2.y) || e2.rowHeight.set(n2.y, Math.floor(e2.config.paddingY / 2));
}
var jr = 8;
function Mr(e2, t2, n2, r, i) {
  let a2 = [], o = (e2.clusterExitPlans?.size ?? 0) > 0;
  o && (e2.preferStraightRoutes = true);
  try {
    for (let o2 = 0; o2 < jr; o2++) {
      let o3 = qn(i, n2, t2.path, t2.style) ?? $n(i, r, t2.path, t2, (t3) => t3.clusterSource !== void 0 && e2.clusterExitPlans?.get(t3.clusterSource)?.edges.has(t3) === true);
      if (!o3) return;
      e2.grid.add(Bt(o3)), a2.push(o3), xi(e2, t2);
    }
  } finally {
    o && (e2.preferStraightRoutes = false);
    for (let t3 of a2) e2.grid.delete(Bt(t3));
  }
}
function Nr(e2, t2) {
  return e2.subgraphs.some((e3) => e3.nodes.includes(t2));
}
function Pr(e2, t2) {
  let n2 = null;
  for (let r of e2.subgraphs) r.nodes.includes(t2) && (!n2 || Fr(n2, r)) && (n2 = r);
  return n2;
}
function Fr(e2, t2) {
  let n2 = t2;
  for (; n2 !== null; ) {
    if (n2 === e2) return true;
    n2 = n2.parent;
  }
  return false;
}
function Ir(e2, t2) {
  let n2 = Pr(e2, t2);
  if (!n2) return null;
  let r = n2;
  for (; r.parent; ) r = r.parent;
  return r;
}
function Lr(e2) {
  let t2 = [...e2.nodes];
  for (let n2 of e2.children) t2.push(...Lr(n2));
  return t2;
}
function Rr(e2, t2, n2) {
  if (t2 === n2) return true;
  let r = /* @__PURE__ */ new Set([t2]), i = [t2];
  for (; i.length > 0; ) {
    let t3 = i.shift();
    for (let a2 of si(e2, t3)) {
      if (a2 === n2) return true;
      r.has(a2) || (r.add(a2), i.push(a2));
    }
  }
  return false;
}
function zr(e2, t2) {
  let n2 = Pr(e2, t2);
  return n2?.direction ? n2.direction : e2.config.graphDirection;
}
function Br(e2, t2) {
  let n2 = Pr(e2, t2);
  if (!n2) return false;
  let r = false;
  for (let i2 of e2.edges) if (i2.to === t2 && Pr(e2, i2.from) !== n2) {
    r = true;
    break;
  }
  if (!r) return false;
  let i = Z2(t2).y;
  for (let r2 of n2.nodes) {
    if (r2 === t2 || !r2.gridCoord) continue;
    let a2 = false;
    for (let t3 of e2.edges) if (t3.to === r2 && Pr(e2, t3.from) !== n2) {
      a2 = true;
      break;
    }
    if (a2 && r2.gridCoord.y < i) return false;
  }
  return true;
}
function Vr(e2, t2) {
  if (t2.nodes.length === 0) return;
  let n2 = 1e6, r = 1e6, i = -1e6, a2 = -1e6;
  for (let o2 of t2.children) Vr(e2, o2), o2.nodes.length > 0 && (n2 = Math.min(n2, o2.minX), r = Math.min(r, o2.minY), i = Math.max(i, o2.maxX), a2 = Math.max(a2, o2.maxY));
  for (let e3 of t2.nodes) {
    if (!e3.drawingCoord || !e3.drawing) continue;
    let t3 = e3.drawingCoord.x, o2 = e3.drawingCoord.y, s2 = t3 + e3.drawing.length - 1, c2 = o2 + e3.drawing[0].length - 1;
    n2 = Math.min(n2, t3), r = Math.min(r, o2), i = Math.max(i, s2), a2 = Math.max(a2, c2);
  }
  t2.minX = n2 - 2, t2.minY = r - 2 - 2, t2.maxX = i + 2, t2.maxY = a2 + 2;
  let o = Math.max(0, ...Q(t2.name).map((e3) => H2(e3))), s = t2.maxX - t2.minX, c = o + 1;
  if (c > s) {
    let e3 = c - s, n3 = Math.floor(e3 / 2), r2 = e3 - n3;
    t2.minX -= n3, t2.maxX += r2;
  }
  let l = t2.titleRoom ?? 0;
  l > 0 && (t2.maxX += l);
}
function Hr(e2) {
  let t2 = e2.subgraphs.filter((e3) => e3.parent === null && e3.nodes.length > 0);
  for (let e3 = 0; e3 < t2.length; e3++) for (let n2 = e3 + 1; n2 < t2.length; n2++) {
    let r = t2[e3], i = t2[n2];
    r.minX < i.maxX && r.maxX > i.minX && (r.maxY >= i.minY - 1 && r.minY < i.minY ? i.minY = r.maxY + 1 + 1 : i.maxY >= r.minY - 1 && i.minY < r.minY && (r.minY = i.maxY + 1 + 1)), r.minY < i.maxY && r.maxY > i.minY && (r.maxX >= i.minX - 1 && r.minX < i.minX ? i.minX = r.maxX + 1 + 1 : i.maxX >= r.minX - 1 && i.minX < r.minX && (r.minX = i.maxX + 1 + 1));
  }
}
function Ur(e2) {
  return Math.max(0, ...Q(e2.name).map((e3) => H2(e3))) + 1;
}
function Wr(e2) {
  let t2 = null;
  for (let n2 of Lr(e2)) {
    let e3 = n2.gridCoord;
    e3 && (t2 = t2 ? {
      minX: Math.min(t2.minX, e3.x),
      minY: Math.min(t2.minY, e3.y),
      maxX: Math.max(t2.maxX, e3.x + 2),
      maxY: Math.max(t2.maxY, e3.y + 2)
    } : {
      minX: e3.x,
      minY: e3.y,
      maxX: e3.x + 2,
      maxY: e3.y + 2
    });
  }
  return t2;
}
function Gr(e2) {
  let t2 = e2.subgraphs.filter((e3) => e3.nodes.length > 0), n2 = (e3, t3) => Fr(e3, t3) || Fr(t3, e3), r = false;
  for (let i = 0; i < 64; i++) {
    for (let t3 of e2.subgraphs) Vr(e2, t3);
    let i2 = false;
    for (let a2 of t2) {
      for (let o of t2) {
        if (n2(a2, o) || !(a2.minX < o.minX) || !(a2.minY < o.maxY && a2.maxY > o.minY)) continue;
        let t3 = a2.maxX + 2 - o.minX;
        if (t3 <= 0) continue;
        let s = a2.parent === null && o.parent === null, c = a2.maxX + 2, l = Lr(o).every((e3) => !e3.drawingCoord || e3.drawingCoord.x > c);
        if (s && l && o.maxX - c >= Ur(o)) continue;
        let u3 = Wr(a2), d2 = Wr(o);
        if (!u3 || !d2 || u3.maxX + 1 >= d2.minX) continue;
        let f2 = u3.maxX + 1;
        e2.columnWidth.set(f2, (e2.columnWidth.get(f2) ?? 0) + t3);
        for (let t4 of e2.nodes) t4.drawingCoord = $2(e2, Z2(t4));
        i2 = true, r = true;
        break;
      }
      if (i2) break;
    }
    if (!i2) break;
  }
  return Kr(e2), r;
}
function Kr(e2) {
  for (let t2 of e2.subgraphs) Vr(e2, t2);
  Hr(e2);
}
function qr(e2) {
  if (e2.subgraphs.length === 0) return;
  let t2 = 0, n2 = 0;
  for (let r2 of e2.subgraphs) t2 = Math.min(t2, r2.minX), n2 = Math.min(n2, r2.minY);
  let r = -t2, i = -n2;
  if (r !== 0 || i !== 0) {
    e2.offsetX = r, e2.offsetY = i;
    for (let t3 of e2.subgraphs) t3.minX += r, t3.minY += i, t3.maxX += r, t3.maxY += i;
    for (let t3 of e2.nodes) t3.drawingCoord && (t3.drawingCoord.x += r, t3.drawingCoord.y += i);
  }
}
function Jr(e2, t2) {
  let n2 = (t3) => {
    let n3 = si(e2, t3);
    return n3.length > 0 ? n3[0].name : null;
  }, r = /* @__PURE__ */ new Map(), i = t2.map((e3, t3) => {
    let i2 = n2(e3);
    if (i2 === null) return t3;
    let a2 = r.get(i2);
    return a2 === void 0 ? (r.set(i2, t3), t3) : a2;
  });
  return t2.map((e3, t3) => ({
    node: e3,
    i: t3
  })).sort((e3, t3) => i[e3.i] - i[t3.i] || e3.i - t3.i).map(({ node: e3 }) => e3);
}
function Yr(e2, t2) {
  let n2 = /* @__PURE__ */ new Set(), r = (t3) => {
    let r2 = [t3];
    for (; r2.length > 0; ) {
      let t4 = r2.shift();
      if (!n2.has(t4.name)) {
        n2.add(t4.name);
        for (let n3 of si(e2, t4)) r2.push(n3);
      }
    }
  };
  for (let e3 of t2) r(e3);
  let i = [...t2];
  for (let t3 of e2.nodes) n2.has(t3.name) || (i.push(t3), r(t3));
  return i;
}
function Xr(e2, t2) {
  return e2.nodes.find((e3) => e3.gridCoord !== null && e3.gridCoord.x === t2.x && e3.gridCoord.y === t2.y);
}
function Zr(e2, t2, n2, r, i) {
  let a2 = r === "x" ? "y" : "x", o = (i2) => {
    let o2 = 4;
    for (; ; ) {
      let s = t2[r] + i2 * o2;
      if (s < 0) return null;
      let c = r === "x" ? {
        x: s,
        y: t2[a2]
      } : {
        x: t2[a2],
        y: s
      };
      if (qt(e2.grid, c, 3)) return c;
      let l = Xr(e2, c);
      if (!l || Ir(e2, l) !== n2) return null;
      o2 += 4;
    }
  };
  return o(i) ?? o(i * -1);
}
function Qr(e2, t2, n2, r) {
  let i = Ir(e2, t2);
  if (!i) return;
  let a2 = n2.get(i);
  if (!a2) return;
  n2.delete(i);
  let o = Z2(t2), s = zr(e2, t2) === "LR" ? "y" : "x";
  for (let t3 of a2) {
    let n3 = zr(e2, t3), a3 = Zr(e2, o, i, s, 1);
    Or(e2, e2.nodes[t3.index], a3 ?? o, n3), r.add(t3);
  }
}
function $r(e2, t2) {
  let n2 = false, r = /* @__PURE__ */ new Set(), i = true;
  for (; i; ) {
    i = false;
    let a2 = false, o = (t3) => e2.config.graphDirection === "LR" ? t3.gridCoord?.y ?? 0 : t3.gridCoord?.x ?? 0, s = e2.nodes.filter((e3) => e3.gridCoord !== null).sort((e3, t3) => o(e3) - o(t3));
    for (let o2 of s) {
      let s2 = o2.gridCoord;
      if (s2 === null) continue;
      let c = [...si(e2, o2)].sort((t3, n3) => oi(e2, t3, n3));
      for (let l of c) {
        if (l.gridCoord !== null) continue;
        let c2 = ei(e2, l);
        if (!n2 && c2.some((e3) => e3.gridCoord === null)) {
          if (a2 = true, !r.has(l)) {
            r.add(l);
            let n3 = e2.config.graphDirection === "LR" ? s2.x + 4 : s2.y + 4;
            t2[n3] = (t2[n3] ?? 0) + 4;
          }
          continue;
        }
        let u3 = Pr(e2, o2), d2 = Pr(e2, l), f2 = u3 && u3 === d2 && u3.direction ? u3.direction : e2.config.graphDirection, p3 = f2 === "LR" ? s2.x + 4 : s2.y + 4;
        if (f2 === e2.config.graphDirection) for (let e3 of c2) {
          let t3 = e3.gridCoord;
          t3 && (p3 = Math.max(p3, f2 === "LR" ? t3.x + 4 : t3.y + 4));
        }
        let m3;
        m3 = f2 === e2.config.graphDirection ? t2[p3] ?? 0 : f2 === "LR" ? s2.y : s2.x;
        let h3 = f2 === "LR" ? {
          x: p3,
          y: m3
        } : {
          x: m3,
          y: p3
        };
        Or(e2, e2.nodes[l.index], h3, f2), f2 === e2.config.graphDirection && (t2[p3] = m3 + 4), i = true;
      }
    }
    !i && a2 && !n2 && (n2 = true, i = true);
  }
}
function ei(e2, t2) {
  let n2 = [];
  for (let r of e2.edges) r.to !== t2 || !r.clusterTarget || r.from === t2 || n2.includes(r.from) || Lr(r.clusterTarget).includes(r.from) || n2.push(r.from);
  return n2;
}
function ti(e2, t2, n2, r) {
  let i = new Set(e2.edges.filter((e3) => e3.to === t2 && e3.from !== t2).map((e3) => e3.from));
  if (i.size !== 1) return;
  let [a2] = [...i], o = a2.gridCoord;
  if (!(!o || Nr(e2, a2)) && !e2.edges.some((e3) => e3.to === a2 || e3.from === a2 && e3.to !== t2) && !(r ? o.y === n2.y : o.x === n2.x)) {
    for (let t3 = 0; t3 < 3; t3++) for (let n3 = 0; n3 < 3; n3++) e2.grid.delete(Bt({
      x: o.x + t3,
      y: o.y + n3
    }));
    Or(e2, a2, r ? {
      x: o.x,
      y: n2.y
    } : {
      x: n2.x,
      y: o.y
    });
  }
}
function ni(e2) {
  let t2 = e2.config.graphDirection === "LR";
  for (let n2 = 0; n2 < e2.nodes.length + 1; n2++) {
    let n3 = false;
    for (let r of e2.subgraphs) {
      let i = Lr(r), a2 = Wr(r);
      if (a2) for (let r2 of e2.nodes) {
        let o = r2.gridCoord;
        if (!(!o || i.includes(r2)) && !(o.x + 2 < a2.minX || o.x > a2.maxX || o.y + 2 < a2.minY || o.y > a2.maxY)) {
          for (let t3 = 0; t3 < 3; t3++) for (let n4 = 0; n4 < 3; n4++) e2.grid.delete(Bt({
            x: o.x + t3,
            y: o.y + n4
          }));
          ti(e2, r2, Or(e2, r2, t2 ? {
            x: o.x,
            y: a2.maxY + 2
          } : {
            x: a2.maxX + 2,
            y: o.y
          }), t2), n3 = true;
        }
      }
    }
    if (!n3) return;
  }
}
function ri(e2) {
  let t2 = e2.config.graphDirection, n2 = [], r = /* @__PURE__ */ new Set();
  for (let t3 of e2.edges) t3.from !== t3.to && r.add(t3.to.name);
  let i = Yr(e2, e2.nodes.filter((e3) => !r.has(e3.name))), a2 = new Set(i), o = [], s = [];
  for (let t3 of i) {
    let n3 = Ir(e2, t3);
    n3 !== null && Lr(n3).some((n4) => n4 !== t3 && !a2.has(n4) && !Rr(e2, t3, n4)) ? o.push(t3) : s.push(t3);
  }
  let c = Jr(e2, s), l = /* @__PURE__ */ new Map();
  for (let t3 of o) {
    let n3 = Ir(e2, t3), r2 = l.get(n3);
    r2 ? r2.push(t3) : l.set(n3, [t3]);
  }
  let u3 = /* @__PURE__ */ new Set(), d2 = false, f2 = false;
  for (let t3 of c) Nr(e2, t3) ? si(e2, t3).length > 0 && (f2 = true) : d2 = true;
  let p3 = t2 === "LR" && d2 && f2, m3, h3 = [];
  p3 ? (m3 = c.filter((t3) => !Nr(e2, t3)), h3 = c.filter((t3) => Nr(e2, t3))) : m3 = c;
  for (let r2 of m3) {
    let i2 = t2 === "LR" ? {
      x: 0,
      y: n2[0] ?? 0
    } : {
      x: n2[0] ?? 0,
      y: 0
    };
    Or(e2, e2.nodes[r2.index], i2), n2[0] = (n2[0] ?? 0) + 4, Qr(e2, r2, l, u3);
  }
  if (p3 && h3.length > 0) for (let r2 of h3) {
    let i2 = t2 === "LR" ? {
      x: 4,
      y: n2[4] ?? 0
    } : {
      x: n2[4] ?? 0,
      y: 4
    };
    Or(e2, e2.nodes[r2.index], i2), n2[4] = (n2[4] ?? 0) + 4, Qr(e2, r2, l, u3);
  }
  $r(e2, n2);
  for (let t3 of o) {
    if (u3.has(t3)) continue;
    let r2 = Ir(e2, t3), i2 = zr(e2, t3), a3 = Lr(r2).filter((e3) => e3 !== t3 && e3.gridCoord !== null), o2;
    if (a3.length > 0) {
      let t4 = a3[0];
      for (let e3 of a3) (i2 === "LR" ? e3.gridCoord.x < t4.gridCoord.x : e3.gridCoord.y < t4.gridCoord.y) && (t4 = e3);
      let n3 = i2 === "LR" ? "y" : "x";
      o2 = Zr(e2, t4.gridCoord, r2, n3, 1) ?? {
        x: t4.gridCoord.x,
        y: t4.gridCoord.y
      };
    } else
      o2 = i2 === "LR" ? {
        x: 0,
        y: n2[0] ?? 0
      } : {
        x: n2[0] ?? 0,
        y: 0
      }, n2[0] = (n2[0] ?? 0) + 4;
    Or(e2, e2.nodes[t3.index], o2, i2);
  }
  $r(e2, n2), ni(e2);
  for (let t3 of e2.nodes) kr(e2, t3);
  e2.pathBudget = rn(), vi(e2), bn(e2), e2.bundles = dn(e2), hn(e2);
  let g3 = Kn(), _3 = Yn(), v2 = Wt(e2.grid), y3 = /* @__PURE__ */ new Set();
  for (let t3 of e2.edges) {
    if (t3.bundle && t3.path.length > 0) {
      Ar(e2, t3.path), Jn(v2, g3, t3.path, t3.style), er(v2, _3, t3.path, t3), wi(e2, t3);
      continue;
    }
    let { added: n3, engaged: r2 } = Rn(e2, t3);
    r2 && y3.add(t3);
    let i2 = e2.preferStraightRoutes;
    r2 && (e2.preferStraightRoutes = true), xi(e2, t3), Mr(e2, t3, g3, _3, v2), e2.preferStraightRoutes = i2, zn(e2, n3), Ar(e2, t3.path), Jn(v2, g3, t3.path, t3.style), er(v2, _3, t3.path, t3), wi(e2, t3);
  }
  for (let t3 of e2.nodes) t3.drawingCoord = $2(e2, Z2(t3)), t3.drawing = oa(t3, e2);
  if (Kr(e2), Gr(e2), wn(e2)) {
    for (let t3 of e2.nodes) t3.drawingCoord = $2(e2, Z2(t3));
    Kr(e2);
  }
  let b3 = () => {
    for (let t3 of e2.nodes) t3.drawingCoord = $2(e2, Z2(t3));
    Kr(e2);
  };
  Bn(e2, y3, b3), Un(e2, () => {
    b3(), Bn(e2, y3, b3);
  }), Gr(e2), Bn(e2, y3, b3), qr(e2), nt(e2.canvas, e2.columnWidth, e2.rowHeight, e2.offsetX, e2.offsetY), rt(e2.roleCanvas, e2.columnWidth, e2.rowHeight, e2.offsetX, e2.offsetY);
}
function ii(e2, t2) {
  return e2.edges.filter((e3) => e3.from.name === t2.name);
}
function ai(e2, t2) {
  let n2 = Pr(e2, t2), r = [], i = n2;
  for (; i !== null; ) r.unshift(i), i = i.parent;
  return r;
}
function oi(e2, t2, n2) {
  let r = ai(e2, t2), i = ai(e2, n2), a2 = 0;
  for (; a2 < r.length && a2 < i.length && r[a2] === i[a2]; ) a2++;
  let o = r[a2], s = i[a2];
  return !o || !s || o === s ? 0 : e2.subgraphs.indexOf(s) - e2.subgraphs.indexOf(o);
}
function si(e2, t2) {
  return ii(e2, t2).map((e3) => e3.to);
}
function ci(e2) {
  return e2 === K2 ? q3 : e2 === q3 ? K2 : e2 === J3 ? Y2 : e2 === Y2 ? J3 : e2 === kt ? Mt : e2 === At ? jt : e2 === jt ? At : e2 === Mt ? kt : Nt;
}
function li(e2, t2) {
  return e2.x === t2.x ? e2.y < t2.y ? q3 : K2 : e2.y === t2.y ? e2.x < t2.x ? Y2 : J3 : e2.x < t2.x ? e2.y < t2.y ? jt : kt : e2.y < t2.y ? Mt : At;
}
function ui(e2) {
  return e2 === "LR" ? [
    Y2,
    q3,
    q3,
    Y2
  ] : [
    q3,
    Y2,
    Y2,
    q3
  ];
}
function di(e2, t2) {
  if (e2.from === e2.to) return ui(t2);
  let n2 = li(Z2(e2.from), Z2(e2.to)), r, i, a2, o, s = t2 === "LR" ? X2(n2, J3) || X2(n2, At) || X2(n2, Mt) : X2(n2, K2) || X2(n2, At) || X2(n2, kt);
  return X2(n2, jt) ? t2 === "LR" ? (r = q3, i = J3, a2 = Y2, o = K2) : (r = Y2, i = K2, a2 = q3, o = J3) : X2(n2, kt) ? t2 === "LR" ? (r = K2, i = J3, a2 = Y2, o = q3) : (r = Y2, i = q3, a2 = K2, o = J3) : X2(n2, Mt) ? t2 === "LR" ? (r = q3, i = q3, a2 = J3, o = K2) : (r = J3, i = K2, a2 = q3, o = Y2) : X2(n2, At) ? t2 === "LR" ? (r = q3, i = q3, a2 = J3, o = q3) : (r = Y2, i = Y2, a2 = K2, o = Y2) : s ? t2 === "LR" && X2(n2, J3) ? (r = q3, i = q3, a2 = J3, o = Y2) : t2 === "TD" && X2(n2, K2) ? (r = Y2, i = Y2, a2 = K2, o = q3) : (r = n2, i = ci(n2), a2 = n2, o = ci(n2)) : (r = n2, i = ci(n2), a2 = n2, o = ci(n2)), [
    r,
    i,
    a2,
    o
  ];
}
var fi = 2;
var pi = 200;
function mi(e2, t2) {
  let n2 = e2.gridCoord;
  return n2 ? t2.x >= n2.x && t2.x <= n2.x + 2 && t2.y >= n2.y && t2.y <= n2.y + 2 : false;
}
function hi(e2, t2, n2 = []) {
  for (let r = 1; r < t2.length - 1; r++) {
    let i = t2[r];
    if (Gt(e2.grid, i) && !n2.some((e3) => mi(e3, i))) return false;
  }
  return true;
}
function gi(e2) {
  let t2 = e2.from.gridCoord, n2 = e2.to.gridCoord;
  return !t2 || !n2 ? false : t2.y === n2.y && t2.x !== n2.x;
}
function _i(e2) {
  let t2 = e2.from.name, n2 = e2.to.name;
  return gi(e2) && n2 < t2 ? JSON.stringify([n2, t2]) : JSON.stringify([t2, n2]);
}
function vi(e2) {
  let t2 = /* @__PURE__ */ new Map();
  for (let n2 of e2.edges) {
    if (n2.from === n2.to) continue;
    let e3 = _i(n2), r = t2.get(e3);
    r ? r.push(n2) : t2.set(e3, [n2]);
  }
  for (let e3 of t2.values()) {
    if (e3.length < 2) continue;
    let t3 = /* @__PURE__ */ new Set();
    for (let n2 = 0; n2 < e3.length; n2++) e3[n2].parallelLane = {
      index: n2,
      total: e3.length,
      usedOffsets: t3
    };
  }
}
function yi(e2, t2, n2, r, i) {
  let a2 = zt(Z2(t2.from), n2), o = zt(Z2(t2.to), r), s = X2(n2, J3) || X2(n2, Y2), c = [t2.from, t2.to], l = t2.parallelLane.usedOffsets, u3 = X2(n2, Y2) ? 1 : X2(n2, J3) ? -1 : X2(n2, q3) ? 1 : -1, d2 = X2(r, Y2) ? 1 : X2(r, J3) ? -1 : X2(r, q3) ? 1 : -1, f2 = s ? {
    x: a2.x + u3,
    y: a2.y
  } : {
    x: a2.x,
    y: a2.y + u3
  }, p3 = s ? {
    x: o.x + d2,
    y: o.y
  } : {
    x: o.x,
    y: o.y + d2
  }, m3 = [a2, o], h3 = [a2, o], g3 = fi * i;
  for (let n3 = 0; n3 < pi; n3++) {
    let r2 = g3 + n3;
    if (l.has(r2)) continue;
    let i2 = a2.y + r2, u4 = a2.x + r2;
    {
      let n4 = s ? q3 : Y2, i3 = zt(Z2(t2.from), n4), a3 = zt(Z2(t2.to), n4), o2 = s ? [{
        x: i3.x,
        y: Math.max(i3.y, a3.y) + r2 - 1
      }, {
        x: a3.x,
        y: Math.max(i3.y, a3.y) + r2 - 1
      }] : [{
        x: Math.max(i3.x, a3.x) + r2 - 1,
        y: i3.y
      }, {
        x: Math.max(i3.x, a3.x) + r2 - 1,
        y: a3.y
      }], u5 = on([
        i3,
        ...o2,
        a3
      ]);
      if (hi(e2, Xt(u5), c)) return l.add(r2), {
        path: u5,
        labelSegment: o2,
        faces: {
          startDir: n4,
          endDir: n4
        }
      };
    }
    let d3 = s ? [{
      x: a2.x,
      y: i2
    }, {
      x: o.x,
      y: i2
    }] : [{
      x: u4,
      y: a2.y
    }, {
      x: u4,
      y: o.y
    }], _3 = on([
      a2,
      d3[0],
      s ? {
        x: p3.x,
        y: i2
      } : {
        x: u4,
        y: p3.y
      },
      p3,
      o
    ]);
    if (hi(e2, Xt(_3), c)) return l.add(r2), {
      path: _3,
      labelSegment: d3
    };
    m3 = _3, h3 = d3;
    let v2 = s ? f2.x !== p3.x : f2.y !== p3.y, y3 = s ? v2 ? [{
      x: f2.x,
      y: i2
    }, {
      x: p3.x,
      y: i2
    }] : [{
      x: f2.x,
      y: i2
    }, {
      x: f2.x,
      y: i2
    }] : v2 ? [{
      x: u4,
      y: f2.y
    }, {
      x: u4,
      y: p3.y
    }] : [{
      x: u4,
      y: f2.y
    }, {
      x: u4,
      y: f2.y
    }], b3 = on(s ? [
      a2,
      f2,
      {
        x: f2.x,
        y: i2
      },
      {
        x: p3.x,
        y: i2
      },
      p3,
      o
    ] : [
      a2,
      f2,
      {
        x: u4,
        y: f2.y
      },
      {
        x: u4,
        y: p3.y
      },
      p3,
      o
    ]);
    if (hi(e2, Xt(b3), c)) return l.add(r2), {
      path: b3,
      labelSegment: y3
    };
    m3 = b3, h3 = y3;
  }
  return {
    path: m3,
    labelSegment: h3
  };
}
function bi(e2, t2, n2) {
  let r = e2.config.graphDirection === "LR" ? Y2 : q3, i = zt(Z2(t2.anchor), r), a2 = Sn(e2, t2, n2);
  return a2 ? {
    path: [i, ...a2.path],
    startDir: r,
    endDir: a2.endDir,
    labelSegment: a2.labelSegment
  } : null;
}
function xi(e2, t2) {
  let n2 = Pr(e2, t2.from), r = Pr(e2, t2.to), [i, a2, o, s] = di(t2, n2 && n2 === r && n2.direction ? n2.direction : e2.config.graphDirection), c = t2.clusterSource ? e2.clusterExitPlans?.get(t2.clusterSource) : void 0;
  if (c?.edges.has(t2)) {
    let n3 = t2.parallelLane && t2.parallelLane.index > 0 ? bi(e2, c, t2) : _n(e2, c, t2);
    if (n3) {
      t2.startDir = n3.startDir, t2.endDir = n3.endDir, t2.path = n3.path, t2.text.length > 0 && Ei(e2, t2, n3.labelSegment, H2(t2.text));
      return;
    }
    c.edges.delete(t2), t2.labelLine = [];
  }
  if (t2.clusterTarget) {
    let n3 = vn(e2, t2);
    if (n3) {
      t2.startDir = n3.startDir, t2.endDir = n3.endDir, t2.path = n3.path, t2.clusterEntered = true;
      let r2 = n3.path[n3.path.length - 1];
      if (t2.text.length > 0 && e2.config.graphDirection === "LR") {
        let n4 = e2.columnWidth.get(r2.x) ?? 0;
        e2.columnWidth.set(r2.x, Math.max(n4, H2(t2.text) + 5));
      }
      return;
    }
    t2.clusterEntered = false;
  }
  if (t2.parallelLane && t2.parallelLane.index > 0) {
    let n3 = X2(i, a2), r2 = n3 ? o : i, c2 = n3 ? s : a2;
    t2.startDir = r2, t2.endDir = c2;
    let l2 = yi(e2, t2, r2, c2, t2.parallelLane.index);
    t2.path = l2.path, l2.faces && (t2.startDir = l2.faces.startDir, t2.endDir = l2.faces.endDir), t2.text.length > 0 && Ei(e2, t2, l2.labelSegment, H2(t2.text));
    return;
  }
  let l = zt(Z2(t2.from), i), u3 = zt(Z2(t2.to), a2), d2 = un(e2, l, u3, Ft(i)), f2 = un(e2, zt(Z2(t2.from), o), zt(Z2(t2.to), s), Ft(o));
  if (d2 !== null && f2 !== null) {
    d2.length <= f2.length ? (t2.startDir = i, t2.endDir = a2, t2.path = d2) : (t2.startDir = o, t2.endDir = s, t2.path = f2);
    return;
  }
  if (d2 !== null) {
    t2.startDir = i, t2.endDir = a2, t2.path = d2;
    return;
  }
  if (f2 !== null) {
    t2.startDir = o, t2.endDir = s, t2.path = f2;
    return;
  }
  t2.startDir = i, t2.endDir = a2, t2.path = Ti([l, u3]);
}
function Si(e2, t2) {
  for (let n2 of e2.nodes) {
    let e3 = n2.gridCoord;
    if (e3 && t2 >= e3.x && t2 <= e3.x + 2) return true;
  }
  return false;
}
function Ci(e2, t2, n2, r) {
  if (!Si(e2, r)) return r;
  for (let i = 1; i <= n2 - t2; i++) {
    let a2 = r + i;
    if (a2 <= n2 && !Si(e2, a2)) return a2;
    let o = r - i;
    if (o >= t2 && !Si(e2, o)) return o;
  }
  return r;
}
function wi(e2, t2) {
  if (t2.text.length === 0 || t2.parallelLane && t2.parallelLane.index > 0 || t2.clusterSource && e2.clusterExitPlans?.get(t2.clusterSource)?.edges.has(t2)) return;
  let n2 = H2(t2.text), r = Ti(t2.path), i = r.length, a2 = [];
  for (let t3 = 1; t3 < i; t3++) {
    let n3 = r[t3 - 1], i2 = r[t3], o2 = [n3, i2], s2 = Di(e2, o2), c2 = n3.x === i2.x;
    a2.push({
      line: o2,
      width: s2,
      index: t3,
      isVertical: c2
    });
  }
  let o = (t3) => hi(e2, Xt(t3)), s = (e3) => e3.index === 1 || e3.index === a2.length, c = a2.filter((e3) => e3.width >= n2 && !s(e3) && o(e3.line)), l;
  if (c.length > 0) c.sort((e3, t3) => t3.index - e3.index), l = c[0].line;
  else {
    let e3 = a2.filter((e4) => e4.width >= n2 && o(e4.line));
    if (e3.length > 0) e3.sort((e4, t3) => t3.index - e4.index), l = e3[0].line;
    else {
      let e4 = a2.filter((e5) => !s(e5) && o(e5.line)), n3 = a2.filter((e5) => o(e5.line)), r2 = e4.length > 0 ? e4 : n3.length > 0 ? n3 : a2;
      if (r2.sort((e5, t3) => t3.width - e5.width), r2.length > 0) l = r2[0].line;
      else {
        let e5 = t2.path[0] ?? {
          x: 0,
          y: 0
        };
        l = [e5, e5];
      }
    }
  }
  Ei(e2, t2, l, n2);
}
function Ti(e2) {
  let t2 = [];
  for (let n2 of e2) {
    let e3 = t2[t2.length - 1];
    e3 && e3.x !== n2.x && e3.y !== n2.y && t2.push({
      x: n2.x,
      y: e3.y
    }), t2.push(n2);
  }
  return t2;
}
function Ei(e2, t2, n2, r) {
  let i = Math.min(n2[0].x, n2[1].x), a2 = Math.max(n2[0].x, n2[1].x), o = Ci(e2, i, a2, i + Math.floor((a2 - i) / 2)), s = e2.columnWidth.get(o) ?? 0;
  e2.columnWidth.set(o, Math.max(s, r + 2)), t2.labelLine = [n2[0], n2[1]];
}
function Di(e2, t2) {
  let n2 = 0, r = Math.min(t2[0].x, t2[1].x), i = Math.max(t2[0].x, t2[1].x);
  for (let t3 = r; t3 <= i; t3++) n2 += e2.columnWidth.get(t3) ?? 0;
  return n2;
}
var Oi = {
  solid: {
    h: {
      unicode: "\u2500",
      ascii: "-"
    },
    v: {
      unicode: "\u2502",
      ascii: "|"
    }
  },
  dotted: {
    h: {
      unicode: "\u2504",
      ascii: "."
    },
    v: {
      unicode: "\u2506",
      ascii: ":"
    }
  },
  thick: {
    h: {
      unicode: "\u2501",
      ascii: "="
    },
    v: {
      unicode: "\u2503",
      ascii: "\u2016"
    }
  },
  invisible: {
    h: {
      unicode: " ",
      ascii: " "
    },
    v: {
      unicode: " ",
      ascii: " "
    }
  }
};
function ki(e2, t2, n2, r, i, a2, o = "solid") {
  let s = li(t2, n2), c = [], l = Oi[o], u3 = a2 ? l.h.ascii : l.h.unicode, d2 = a2 ? l.v.ascii : l.v.unicode;
  if (X2(s, K2)) for (let a3 = t2.y - r; a3 >= n2.y - i; a3--) c.push({
    x: t2.x,
    y: a3
  }), G(e2, t2.x, a3, d2);
  else if (X2(s, q3)) for (let a3 = t2.y + r; a3 <= n2.y + i; a3++) c.push({
    x: t2.x,
    y: a3
  }), G(e2, t2.x, a3, d2);
  else if (X2(s, J3)) for (let a3 = t2.x - r; a3 >= n2.x - i; a3--) c.push({
    x: a3,
    y: t2.y
  }), G(e2, a3, t2.y, u3);
  else if (X2(s, Y2)) for (let a3 = t2.x + r; a3 <= n2.x + i; a3++) c.push({
    x: a3,
    y: t2.y
  }), G(e2, a3, t2.y, u3);
  else if (X2(s, At)) {
    for (let i2 = t2.x - r; i2 >= n2.x; i2--) c.push({
      x: i2,
      y: t2.y
    }), G(e2, i2, t2.y, u3);
    for (let r2 = t2.y - 1; r2 >= n2.y - i; r2--) c.push({
      x: n2.x,
      y: r2
    }), G(e2, n2.x, r2, d2);
  } else if (X2(s, kt)) {
    for (let i2 = t2.x + r; i2 <= n2.x; i2++) c.push({
      x: i2,
      y: t2.y
    }), G(e2, i2, t2.y, u3);
    for (let r2 = t2.y - 1; r2 >= n2.y - i; r2--) c.push({
      x: n2.x,
      y: r2
    }), G(e2, n2.x, r2, d2);
  } else if (X2(s, Mt)) {
    for (let i2 = t2.x - r; i2 >= n2.x; i2--) c.push({
      x: i2,
      y: t2.y
    }), G(e2, i2, t2.y, u3);
    for (let r2 = t2.y + 1; r2 <= n2.y + i; r2++) c.push({
      x: n2.x,
      y: r2
    }), G(e2, n2.x, r2, d2);
  } else if (X2(s, jt)) {
    if (n2.x - t2.x <= 1) for (let a3 = t2.y + r; a3 <= n2.y + i; a3++) c.push({
      x: t2.x,
      y: a3
    }), G(e2, t2.x, a3, d2);
    else {
      for (let i2 = t2.x + r; i2 <= n2.x; i2++) c.push({
        x: i2,
        y: t2.y
      }), G(e2, i2, t2.y, u3);
      for (let r2 = t2.y + 1; r2 <= n2.y + i; r2++) c.push({
        x: n2.x,
        y: r2
      }), G(e2, n2.x, r2, d2);
    }
  }
  return c;
}
function Ai(e2, t2) {
  if (t2.path.length === 0) {
    let t3 = W(e2.canvas);
    return [
      t3,
      t3,
      t3,
      t3,
      t3,
      t3
    ];
  }
  let n2 = qi(e2, t2), [r, i, a2] = Ni(e2, t2.path, t2.style, Mi(e2, t2)), o = i.length > 0, s = t2.style === "invisible", c = o && !s ? Ii(e2, t2.path, i[0], t2.from) : W(e2.canvas), l;
  l = t2.hasArrowEnd && o ? Bi(e2, i[i.length - 1], a2[a2.length - 1], t2.endMarker) : W(e2.canvas);
  let u3;
  if (t2.hasArrowStart && o) {
    let n3 = i[0][0], r2 = ji(a2[0]), o2 = {
      x: n3.x,
      y: n3.y
    };
    X2(a2[0], Y2) ? o2.x = n3.x - 1 : X2(a2[0], J3) ? o2.x = n3.x + 1 : X2(a2[0], q3) ? o2.y = n3.y - 1 : X2(a2[0], K2) && (o2.y = n3.y + 1), u3 = Bi(e2, [n3, o2], r2, t2.startMarker);
  } else u3 = W(e2.canvas);
  let d2 = s ? W(e2.canvas) : Vi(e2, t2.path);
  return [
    r,
    c,
    l,
    u3,
    d2,
    n2
  ];
}
function ji(e2) {
  return X2(e2, K2) ? q3 : X2(e2, q3) ? K2 : X2(e2, J3) ? Y2 : X2(e2, Y2) ? J3 : X2(e2, At) ? jt : X2(e2, kt) ? Mt : X2(e2, Mt) ? kt : X2(e2, jt) ? At : Nt;
}
function Mi(e2, t2) {
  let n2 = t2.clusterTarget, r = t2.path[t2.path.length - 1], i = t2.path[t2.path.length - 2];
  if (!t2.clusterEntered || !n2 || !r || !i) return;
  let a2 = $2(e2, i), o = $2(e2, r);
  return e2.config.graphDirection === "LR" ? n2.minX > a2.x ? {
    x: n2.minX,
    y: o.y
  } : void 0 : n2.minY > a2.y ? {
    x: o.x,
    y: n2.minY
  } : void 0;
}
function Ni(e2, t2, n2 = "solid", r) {
  let i = W(e2.canvas), a2 = t2[0], o = [], s = [];
  for (let c = 1; c < t2.length; c++) {
    let l = t2[c], u3 = $2(e2, a2), d2 = r && c === t2.length - 1 ? r : $2(e2, l);
    if (Rt(u3, d2)) {
      a2 = l;
      continue;
    }
    let f2 = li(a2, l), p3 = ki(i, u3, d2, 1, -1, e2.config.useAscii, n2);
    p3.length === 0 && p3.push(u3), o.push(p3), s.push(f2), a2 = l;
  }
  return [
    i,
    o,
    s
  ];
}
var Pi = /* @__PURE__ */ new Set([
  "\u2502",
  "\u2503",
  "\u2551",
  "\u2506",
  "\u250A",
  "|",
  "\u2016"
]);
var Fi = /* @__PURE__ */ new Set([
  "\u2500",
  "\u2501",
  "\u2550",
  "\u254C",
  "\u2504",
  "-",
  "="
]);
function Ii(e2, t2, n2, r) {
  let i = W(e2.canvas), a2 = e2.config.useAscii;
  if (r.shape === "state-start" || r.shape === "state-end") return i;
  let o = n2[0], s = li(t2[0], t2[1]), c = a2 ? "+" : null, l = (t3, n3) => e2.canvas[t3]?.[n3];
  if (X2(s, K2)) {
    let e3 = o.x, t3 = o.y + 1, n3 = l(e3, t3);
    G(i, e3, t3, n3 !== void 0 && Fi.has(n3) ? c ?? "\u2534" : a2 ? "|" : "\u2502");
  } else if (X2(s, q3)) {
    let e3 = o.x, t3 = o.y - 1, n3 = l(e3, t3);
    G(i, e3, t3, n3 !== void 0 && Fi.has(n3) ? c ?? "\u252C" : a2 ? "|" : "\u2502");
  } else if (X2(s, J3) || X2(s, Y2)) {
    let e3 = r.drawingCoord, t3 = r.drawing;
    if (e3 === null || t3 === null)
      throw Error(`drawBoxStart: node "${r.name}" has no drawingCoord/drawing assigned`);
    let n3 = t3.length, u3 = X2(s, J3) ? e3.x : e3.x + n3 - 1, d2 = o.y, f2 = l(u3, d2);
    G(i, u3, d2, f2 !== void 0 && Pi.has(f2) ? c ?? (X2(s, J3) ? "\u2524" : "\u251C") : a2 ? "-" : "\u2500");
  }
  return i;
}
function Li(e2, t2) {
  if (t2 === "circle") return e2 ? "o" : "\u25CB";
  if (t2 === "cross") return e2 ? "x" : "\u2715";
}
function Ri(e2) {
  if (X2(e2, K2)) return "\u25B2";
  if (X2(e2, q3)) return "\u25BC";
  if (X2(e2, J3)) return "\u25C4";
  if (X2(e2, Y2)) return "\u25BA";
  if (X2(e2, kt)) return "\u2197";
  if (X2(e2, At)) return "\u2196";
  if (X2(e2, jt)) return "\u2198";
  if (X2(e2, Mt)) return "\u2199";
}
function zi(e2) {
  if (X2(e2, K2)) return "^";
  if (X2(e2, q3)) return "v";
  if (X2(e2, J3)) return "<";
  if (X2(e2, Y2)) return ">";
}
function Bi(e2, t2, n2, r) {
  let i = W(e2.canvas);
  if (t2.length === 0) return i;
  let a2 = t2[t2.length - 1], o = li(t2.length >= 2 ? t2[t2.length - 2] : t2[0], a2);
  (t2.length === 1 || X2(o, Nt)) && (o = n2);
  let s = Li(e2.config.useAscii, r), c;
  if (s !== void 0) c = s;
  else if (e2.config.useAscii) {
    let e3 = zi(o);
    c = e3 === void 0 ? zi(n2) ?? "*" : e3;
  } else {
    let e3 = Ri(o);
    c = e3 === void 0 ? Ri(n2) ?? "\u25CF" : e3;
  }
  return G(i, a2.x, a2.y, c), i;
}
function Vi(e2, t2) {
  let n2 = W(e2.canvas);
  for (let r = 1; r < t2.length - 1; r++) {
    let i = t2[r], a2 = $2(e2, i), o = li(t2[r - 1], i), s = li(i, t2[r + 1]), c;
    c = e2.config.useAscii ? "+" : X2(o, s) ? X2(o, K2) || X2(o, q3) ? "\u2502" : "\u2500" : X2(o, Y2) && X2(s, q3) || X2(o, K2) && X2(s, J3) ? "\u2510" : X2(o, Y2) && X2(s, K2) || X2(o, q3) && X2(s, J3) ? "\u2518" : X2(o, J3) && X2(s, q3) || X2(o, K2) && X2(s, Y2) ? "\u250C" : X2(o, J3) && X2(s, K2) || X2(o, q3) && X2(s, Y2) ? "\u2514" : "+", G(n2, a2.x, a2.y, c);
  }
  return n2;
}
function Hi(e2, t2) {
  return e2.edges.some((e3) => e3 !== t2 && e3.from === t2.to && e3.to === t2.from);
}
function Ui(e2, t2) {
  if (t2.text.length === 0) return null;
  let n2 = Dr(e2, t2.labelLine), r;
  if (t2.path.length >= 2) {
    let e3 = t2.path[0].y, n3 = t2.path[t2.path.length - 1].y;
    n3 < e3 ? r = true : n3 > e3 && (r = false);
  }
  let i = Hi(e2, t2) || e2.config.graphDirection !== "LR" && t2.clusterSource !== void 0 && e2.clusterExitPlans?.get(t2.clusterSource)?.edges.has(t2) === true;
  return Gi(e2, t2, Wi(e2, Ki(e2, Ji(n2, t2.text, r, i), n2[0]?.x === n2[1]?.x ? n2[0]?.x : void 0), n2));
}
function Wi(e2, t2, n2) {
  if (n2.length < 2 || e2.subgraphs.length === 0) return t2;
  let r = Math.min(n2[0].y, n2[1].y), i = Math.max(n2[0].y, n2[1].y), a2 = (t3, n3) => e2.subgraphs.some((e3) => {
    if (e3.nodes.length === 0) return false;
    let r2 = Q(e3.name).length;
    return n3 >= e3.minY && n3 <= e3.minY + r2 && t3.x <= e3.maxX && t3.x + H2(t3.text) - 1 >= e3.minX;
  });
  return t2.map((e3) => {
    if (!a2(e3, e3.y)) return e3;
    let t3 = null;
    for (let n3 = r + 1; n3 < i; n3++) a2(e3, n3) || (t3 === null || Math.abs(n3 - e3.y) < Math.abs(t3 - e3.y)) && (t3 = n3);
    return t3 === null ? e3 : {
      ...e3,
      y: t3
    };
  });
}
function Gi(e2, t2, n2) {
  let r = t2.clusterSource ? e2.clusterExitPlans?.get(t2.clusterSource) : void 0;
  if (e2.config.graphDirection !== "LR" || !r?.edges.has(t2) || !t2.parallelLane || t2.parallelLane.index === 0) return n2;
  let i = $2(e2, r.gutter).x + 2;
  return n2.map((e3) => e3.x < i ? {
    ...e3,
    x: i
  } : e3);
}
function Ki(e2, t2, n2) {
  return n2 === void 0 ? t2 : t2.map((t3) => {
    let r = H2(t3.text), { x: i } = t3;
    for (let a2 of e2.subgraphs) if (!(t3.y <= a2.minY || t3.y >= a2.maxY)) for (let e3 of [a2.minX, a2.maxX]) e3 < i || e3 >= i + r || n2 === e3 || (i = n2 > e3 ? e3 + 1 : e3 - r);
    return i === t3.x ? t3 : {
      ...t3,
      x: i
    };
  });
}
function qi(e2, t2) {
  let n2 = W(e2.canvas);
  for (let { x: r, y: i, text: a2 } of Ui(e2, t2) ?? []) tt(n2, {
    x: r,
    y: i
  }, a2);
  return n2;
}
function Ji(e2, t2, n2, r = false) {
  if (e2.length < 2) return [];
  let i = Math.min(e2[0].x, e2[1].x), a2 = Math.max(e2[0].x, e2[1].x), o = Math.min(e2[0].y, e2[1].y), s = Math.max(e2[0].y, e2[1].y), c = i + Math.floor((a2 - i) / 2), l = o + Math.floor((s - o) / 2);
  if (n2 !== void 0 && i === a2) {
    let e3 = s - o, t3 = Math.max(1, Math.floor(e3 / 4));
    (r ? n2 : !n2) ? l -= t3 : l += t3;
  }
  let u3 = Q(t2), d2 = l - Math.floor((u3.length - 1) / 2);
  return u3.map((e3, t3) => ({
    x: c - Math.floor(H2(e3) / 2),
    y: d2 + t3,
    text: e3
  }));
}
function Yi(e2, t2, n2) {
  let r = Z2(t2), i = 0;
  for (let t3 = 0; t3 < 2; t3++) i += e2.columnWidth.get(r.x + t3) ?? 0;
  let a2 = 0;
  for (let t3 = 0; t3 < 2; t3++) a2 += e2.rowHeight.get(r.y + t3) ?? 0;
  let o = {
    width: i + 1,
    height: a2 + 1,
    labelArea: {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    },
    gridColumns: [
      0,
      0,
      0
    ],
    gridRows: [
      0,
      0,
      0
    ]
  }, s = t2.drawingCoord;
  if (s === null)
    throw Error(`Node "${t2.name}" has no drawingCoord; grid layout must run before bundled-edge drawing`);
  return Er(t2.shape, n2, o, s);
}
function Xi(e2, t2, n2) {
  let r = W(e2.canvas), i = t2.pathToJunction;
  if (!i || i.length === 0) return [
    r,
    r,
    r,
    r,
    r,
    r
  ];
  let a2 = W(e2.canvas), o = e2.config.useAscii, s = i.map((r2, a3) => n2.type === "fan-in" && a3 === 0 ? Yi(e2, t2.from, t2.startDir) : n2.type === "fan-out" && a3 === i.length - 1 ? Yi(e2, t2.to, t2.endDir) : $2(e2, r2));
  for (let e3 = 1; e3 < s.length; e3++) {
    let n3 = s[e3 - 1], r2 = s[e3];
    Rt(n3, r2) || ki(a2, n3, r2, 1, -1, o, t2.style);
  }
  let c = W(e2.canvas);
  for (let t3 = 1; t3 < i.length - 1; t3++) {
    let n3 = i[t3], r2 = $2(e2, n3), a3 = li(i[t3 - 1], n3), s2 = li(n3, i[t3 + 1]), l2;
    l2 = o ? "+" : X2(a3, Y2) && X2(s2, q3) || X2(a3, K2) && X2(s2, J3) ? "\u2510" : X2(a3, Y2) && X2(s2, K2) || X2(a3, q3) && X2(s2, J3) ? "\u2518" : X2(a3, J3) && X2(s2, q3) || X2(a3, K2) && X2(s2, Y2) ? "\u250C" : X2(a3, J3) && X2(s2, K2) || X2(a3, q3) && X2(s2, Y2) ? "\u2514" : "+", G(c, r2.x, r2.y, l2);
  }
  let l = W(e2.canvas);
  if (n2.type === "fan-in" && i.length >= 2) {
    let e3 = s[0], t3 = li(i[0], i[1]), n3 = o ? "+" : null;
    X2(t3, K2) ? G(l, e3.x, e3.y, n3 ?? "\u2534") : X2(t3, q3) ? G(l, e3.x, e3.y, n3 ?? "\u252C") : X2(t3, J3) ? G(l, e3.x, e3.y, n3 ?? "\u2524") : X2(t3, Y2) && G(l, e3.x, e3.y, n3 ?? "\u251C");
  }
  return [
    a2,
    l,
    r,
    r,
    c,
    W(e2.canvas)
  ];
}
function Zi(e2, t2) {
  let n2 = W(e2.canvas), r = W(e2.canvas);
  if (t2.sharedPath.length < 2) return [n2, r];
  let i = e2.config.useAscii, a2 = t2.edges[0]?.style ?? "solid", o = e2.config.graphDirection, s = t2.sharedPath.map((n3, r2) => {
    if (t2.type === "fan-in" && r2 === t2.sharedPath.length - 1) {
      let n4 = o === "TD" ? K2 : J3;
      return Yi(e2, t2.sharedNode, n4);
    }
    if (t2.type === "fan-out" && r2 === 0) {
      let n4 = o === "TD" ? q3 : Y2;
      return Yi(e2, t2.sharedNode, n4);
    }
    return $2(e2, n3);
  });
  for (let e3 = 1; e3 < s.length; e3++) {
    let t3 = s[e3 - 1], r2 = s[e3];
    Rt(t3, r2) || ki(n2, t3, r2, 1, -1, i, a2);
  }
  for (let n3 = 1; n3 < t2.sharedPath.length - 1; n3++) {
    let a3 = t2.sharedPath[n3], o2 = $2(e2, a3), s2 = li(t2.sharedPath[n3 - 1], a3), c = li(a3, t2.sharedPath[n3 + 1]), l;
    l = i ? "+" : X2(s2, Y2) && X2(c, q3) || X2(s2, K2) && X2(c, J3) ? "\u2510" : X2(s2, Y2) && X2(c, K2) || X2(s2, q3) && X2(c, J3) ? "\u2518" : X2(s2, J3) && X2(c, q3) || X2(s2, K2) && X2(c, Y2) ? "\u250C" : X2(s2, J3) && X2(c, K2) || X2(s2, q3) && X2(c, Y2) ? "\u2514" : "+", G(r, o2.x, o2.y, l);
  }
  return [n2, r];
}
function Qi(e2, t2) {
  let n2 = W(e2.canvas);
  if (t2.sharedPath.length < 2) return n2;
  let r = t2.sharedPath.length - 1, i = t2.sharedPath[r - 1], a2 = t2.sharedPath[r], o = li(i, a2), s = e2.config.graphDirection, c = s === "TD" ? K2 : J3, l = Yi(e2, t2.sharedNode, c);
  s === "TD" ? --l.y : --l.x;
  let u3 = t2.edges[0]?.endMarker, d2 = t2.edges.every((e3) => e3.endMarker === u3) ? u3 : void 0, f2 = Li(e2.config.useAscii, d2), p3;
  return p3 = f2 === void 0 ? e2.config.useAscii ? X2(o, K2) ? "^" : X2(o, q3) ? "v" : X2(o, J3) ? "<" : X2(o, Y2) ? ">" : "v" : X2(o, K2) ? "\u25B2" : X2(o, q3) ? "\u25BC" : X2(o, J3) ? "\u25C4" : X2(o, Y2) ? "\u25BA" : "\u25BC" : f2, G(n2, l.x, l.y, p3), n2;
}
function $i(e2, t2) {
  let n2 = W(e2.canvas);
  if (!t2.pathToJunction || t2.pathToJunction.length < 2) return n2;
  let r = t2.pathToJunction.length - 1, i = t2.pathToJunction[r - 1], a2 = t2.pathToJunction[r], o = li(i, a2), s = e2.config.graphDirection, c = s === "TD" ? K2 : J3, l = Yi(e2, t2.to, c);
  s === "TD" ? --l.y : --l.x;
  let u3 = Li(e2.config.useAscii, t2.endMarker), d2;
  return d2 = u3 === void 0 ? e2.config.useAscii ? X2(o, K2) ? "^" : X2(o, q3) ? "v" : X2(o, J3) ? "<" : X2(o, Y2) ? ">" : "v" : X2(o, K2) ? "\u25B2" : X2(o, q3) ? "\u25BC" : X2(o, J3) ? "\u25C4" : X2(o, Y2) ? "\u25BA" : "\u25BC" : u3, G(n2, l.x, l.y, d2), n2;
}
function ea(e2) {
  return X2(e2, K2) ? q3 : X2(e2, q3) ? K2 : X2(e2, J3) ? Y2 : X2(e2, Y2) ? J3 : e2;
}
function ta(e2, t2) {
  let n2 = W(e2.canvas);
  if (t2.sharedPath.length < 2) return n2;
  let r = t2.sharedPath[0], i = t2.sharedPath[1], a2 = ea(li(r, i)), o = e2.config.graphDirection, s = o === "TD" ? q3 : Y2, c = Yi(e2, t2.sharedNode, s);
  o === "TD" ? c.y += 1 : c.x += 1;
  let l;
  return l = e2.config.useAscii ? X2(a2, K2) ? "^" : X2(a2, q3) ? "v" : X2(a2, J3) ? "<" : X2(a2, Y2) ? ">" : "^" : X2(a2, K2) ? "\u25B2" : X2(a2, q3) ? "\u25BC" : X2(a2, J3) ? "\u25C4" : X2(a2, Y2) ? "\u25BA" : "\u25B2", G(n2, c.x, c.y, l), n2;
}
function na(e2, t2) {
  let n2 = W(e2.canvas);
  if (!t2.pathToJunction || t2.pathToJunction.length < 2) return n2;
  let r = t2.pathToJunction[0], i = t2.pathToJunction[1], a2 = ea(li(r, i)), o = Yi(e2, t2.from, t2.startDir);
  X2(t2.startDir, K2) ? --o.y : X2(t2.startDir, q3) ? o.y += 1 : X2(t2.startDir, J3) ? --o.x : X2(t2.startDir, Y2) && (o.x += 1);
  let s;
  return s = e2.config.useAscii ? X2(a2, K2) ? "^" : X2(a2, q3) ? "v" : X2(a2, J3) ? "<" : X2(a2, Y2) ? ">" : "v" : X2(a2, K2) ? "\u25B2" : X2(a2, q3) ? "\u25BC" : X2(a2, J3) ? "\u25C4" : X2(a2, Y2) ? "\u25BA" : "\u25BC", G(n2, o.x, o.y, s), n2;
}
function ra(e2, t2) {
  let n2 = W(e2.canvas);
  if (!t2.junctionPoint) return n2;
  let r = $2(e2, t2.junctionPoint), i = e2.config.useAscii, a2 = false, o = false, s = false, c = false;
  if (t2.sharedPath.length >= 2) {
    let e3 = t2.type === "fan-in" ? 0 : t2.sharedPath.length - 1, n3 = t2.type === "fan-in" ? 1 : t2.sharedPath.length - 2, r2 = li(t2.sharedPath[e3], t2.sharedPath[n3]);
    X2(r2, q3) ? o = true : X2(r2, K2) ? a2 = true : X2(r2, Y2) ? c = true : X2(r2, J3) && (s = true);
  }
  for (let e3 of t2.edges) if (e3.pathToJunction && e3.pathToJunction.length >= 2) {
    let n3 = t2.type === "fan-in" ? e3.pathToJunction.length - 1 : 0, r2 = t2.type === "fan-in" ? e3.pathToJunction.length - 2 : 1, i2 = li(e3.pathToJunction[r2], e3.pathToJunction[n3]);
    X2(i2, q3) ? a2 = true : X2(i2, K2) ? o = true : X2(i2, Y2) ? s = true : X2(i2, J3) && (c = true);
  }
  let l;
  return l = i ? "+" : a2 && o && s && c ? "\u253C" : o && s && c && !a2 ? "\u252C" : a2 && s && c && !o ? "\u2534" : a2 && o && c && !s ? "\u251C" : a2 && o && s && !c ? "\u2524" : s && c ? "\u2500" : a2 && o ? "\u2502" : o && c ? "\u250C" : o && s ? "\u2510" : a2 && c ? "\u2514" : a2 && s ? "\u2518" : "\u253C", G(n2, r.x, r.y, l), n2;
}
function ia(e2, t2) {
  return aa(e2, t2);
}
function aa(e2, t2) {
  let n2 = Z2(e2), r = t2.config.useAscii, i = 0;
  for (let e3 = 0; e3 < 2; e3++) i += t2.columnWidth.get(n2.x + e3) ?? 0;
  let a2 = 0;
  for (let e3 = 0; e3 < 2; e3++) a2 += t2.rowHeight.get(n2.y + e3) ?? 0;
  let o = {
    x: 0,
    y: 0
  }, s = {
    x: i,
    y: a2
  }, c = U2(Math.max(o.x, s.x), Math.max(o.y, s.y)), l = nr(e2.shape, r), u3 = e2.shape === "state-end", d2 = r ? u3 ? "=" : "-" : u3 ? "\u2550" : "\u2500", f2 = r ? u3 ? "\u2016" : "|" : u3 ? "\u2551" : "\u2502", p3 = u3 ? r ? {
    tl: "#",
    tr: "#",
    bl: "#",
    br: "#"
  } : {
    tl: "\u2554",
    tr: "\u2557",
    bl: "\u255A",
    br: "\u255D"
  } : l;
  for (let e3 = o.x + 1; e3 < s.x; e3++) G(c, e3, o.y, d2);
  for (let e3 = o.x + 1; e3 < s.x; e3++) G(c, e3, s.y, d2);
  for (let e3 = o.y + 1; e3 < s.y; e3++) G(c, o.x, e3, f2);
  for (let e3 = o.y + 1; e3 < s.y; e3++) G(c, s.x, e3, f2);
  if (G(c, o.x, o.y, p3.tl), G(c, s.x, o.y, p3.tr), G(c, o.x, s.y, p3.bl), G(c, s.x, s.y, p3.br), e2.shape === "cylinder" && s.y - o.y >= 4) for (let e3 of [o.y + 1, s.y - 1]) {
    for (let t3 = o.x + 1; t3 < s.x; t3++) G(c, t3, e3, d2);
    G(c, o.x, e3, f2), G(c, s.x, e3, f2);
  }
  let m3 = e2.displayLabel, h3 = Q(m3), g3 = o.y + Math.floor(a2 / 2) - Math.floor((h3.length - 1) / 2);
  e2.labelRows = {
    top: g3,
    bottom: g3 + h3.length - 1
  };
  for (let e3 = 0; e3 < h3.length; e3++) {
    let t3 = h3[e3], n3 = H2(t3), r2 = o.x + Math.floor(i / 2) - Math.ceil(n3 / 2) + 1, a3 = je2(t3);
    for (let t4 = 0; t4 < a3.length; t4++) G(c, r2 + t4, g3 + e3, a3[t4]);
  }
  return c;
}
function oa(e2, t2) {
  return ia(e2, t2);
}
function sa(e2) {
  return /^[┌┐└┘├┤┬┴┼│─╭╮╰╯+\-|]$/.test(e2) ? "border" : "text";
}
function ca(e2, t2 = 1) {
  let n2 = Math.max(0, t2), r = 0;
  for (let t3 of e2) for (let e3 of t3) r = Math.max(r, H2(e3));
  let i = 0;
  for (let t3 of e2) i += Math.max(t3.length, 1);
  return {
    width: r + 2 * n2 + 2,
    height: i + (e2.length - 1) + 2
  };
}
function la(e2, t2, n2 = 1) {
  let r = Math.max(0, n2), { width: i, height: a2 } = ca(e2, r), o = t2 ? "-" : "\u2500", s = t2 ? "|" : "\u2502", c = t2 ? "+" : "\u250C", l = t2 ? "+" : "\u2510", u3 = t2 ? "+" : "\u2514", d2 = t2 ? "+" : "\u2518", f2 = t2 ? "+" : "\u251C", p3 = t2 ? "+" : "\u2524", m3 = U2(i - 1, a2 - 1);
  G(m3, 0, 0, c);
  for (let e3 = 1; e3 < i - 1; e3++) G(m3, e3, 0, o);
  G(m3, i - 1, 0, l), G(m3, 0, a2 - 1, u3);
  for (let e3 = 1; e3 < i - 1; e3++) G(m3, e3, a2 - 1, o);
  G(m3, i - 1, a2 - 1, d2);
  for (let e3 = 1; e3 < a2 - 1; e3++) G(m3, 0, e3, s), G(m3, i - 1, e3, s);
  let h3 = 1;
  for (let t3 = 0; t3 < e2.length; t3++) {
    let n3 = e2[t3], a3 = n3.length > 0 ? n3 : [""];
    for (let e3 of a3) {
      let t4 = 1 + r, n4 = je2(e3);
      for (let e4 = 0; e4 < n4.length; e4++) G(m3, t4 + e4, h3, n4[e4]);
      h3++;
    }
    if (t3 < e2.length - 1) {
      G(m3, 0, h3, f2);
      for (let e3 = 1; e3 < i - 1; e3++) G(m3, e3, h3, o);
      G(m3, i - 1, h3, p3), h3++;
    }
  }
  return m3;
}
function ua(e2) {
  function t2(e3) {
    return e3.parent === null ? 0 : 1 + t2(e3.parent);
  }
  let n2 = [...e2];
  return n2.sort((e3, n3) => t2(e3) - t2(n3)), n2;
}
function da(e2, t2, n2, r) {
  for (let i = 0; i < t2.length; i++) for (let a2 = 0; a2 < (t2[0]?.length ?? 0); a2++) {
    let o = t2[i]?.[a2];
    if (o && o !== " ") {
      let t3 = i + n2.x, o2 = a2 + n2.y;
      t3 >= 0 && o2 >= 0 && Pe2(e2, t3, o2, r);
    }
  }
}
function fa(e2, t2, n2, r) {
  for (let i of t2) da(e2, i, n2, r);
}
function pa(e2) {
  let t2 = null;
  for (let [n2, r] of e2.entries()) for (let [e3, i] of r.entries()) i !== " " && (t2 = t2 ? {
    x0: Math.min(t2.x0, n2),
    x1: Math.max(t2.x1, n2),
    y0: Math.min(t2.y0, e3),
    y1: Math.max(t2.y1, e3)
  } : {
    x0: n2,
    x1: n2,
    y0: e3,
    y1: e3
  });
  return t2;
}
function ma(e2, t2, n2) {
  let r = (e3) => /^[┌┐└┘├┤┬┴┼│─╭╮╰╯+\-|.':]$/.test(e3);
  for (let i = 0; i < t2.length; i++) for (let a2 = 0; a2 < (t2[0]?.length ?? 0); a2++) {
    let o = t2[i]?.[a2];
    if (o && o !== " ") {
      let t3 = i + n2.x, s = a2 + n2.y;
      t3 >= 0 && s >= 0 && Pe2(e2, t3, s, r(o) ? "border" : "text");
    }
  }
}
function ha(e2) {
  let t2 = [];
  e2.labelRects = t2;
  let n2 = e2.config.useAscii, r = {
    x: 0,
    y: 0
  }, i = ua(e2.subgraphs);
  for (let t3 of i) {
    let r2 = kn(t3, e2), i2 = {
      x: t3.minX,
      y: t3.minY
    };
    e2.canvas = Ue(e2.canvas, i2, n2, r2), da(e2.roleCanvas, r2, i2, "border");
  }
  for (let r2 of e2.nodes) if (!r2.drawn && r2.drawingCoord && r2.drawing) {
    if (e2.canvas = Ue(e2.canvas, r2.drawingCoord, n2, r2.drawing), ma(e2.roleCanvas, r2.drawing, r2.drawingCoord), r2.labelRows) {
      let { x: n3, y: i2 } = r2.drawingCoord, a3 = {
        x0: n3 + 1,
        x1: n3 + r2.drawing.length - 2,
        y0: i2 + r2.labelRows.top,
        y1: i2 + r2.labelRows.bottom
      };
      t2.push(a3);
      for (let t3 = a3.x0; t3 <= a3.x1; t3++) for (let n4 = a3.y0; n4 <= a3.y1; n4++) {
        let r3 = e2.canvas[t3]?.[n4];
        r3 && r3 !== " " && Pe2(e2.roleCanvas, t3, n4, "text");
      }
    }
    r2.drawn = true;
  }
  let a2 = [], o = [], s = [], c = [], l = [], u3 = [], d2 = [], f2 = /* @__PURE__ */ new Set();
  for (let t3 of e2.edges) if (t3.bundle && t3.pathToJunction) {
    let n3 = t3.bundle, [r2, i2, , , p4, m3] = Xi(e2, t3, n3);
    if (a2.push(r2), o.push(p4), l.push(i2), u3.push(m3), n3.type === "fan-in" && t3.hasArrowStart) {
      let n4 = na(e2, t3);
      c.push(n4);
    }
    if (!f2.has(n3)) {
      f2.add(n3);
      let [t4, r3] = Zi(e2, n3);
      if (a2.push(t4), o.push(r3), n3.type === "fan-in") {
        let t5 = Qi(e2, n3);
        s.push(t5);
      }
      if (n3.type === "fan-out" && n3.edges.every((e3) => e3.hasArrowStart)) {
        let t5 = ta(e2, n3);
        c.push(t5);
      }
      let i3 = ra(e2, n3);
      d2.push(i3);
    }
    if (n3.type === "fan-out" && t3.hasArrowEnd) {
      let n4 = $i(e2, t3);
      s.push(n4);
    }
  } else {
    let [n3, r2, i2, d3, f3, p4] = Ai(e2, t3);
    a2.push(n3), o.push(f3), s.push(i2), c.push(d3), l.push(r2), u3.push(p4);
  }
  let p3 = He2(a2);
  e2.canvas = Ue(e2.canvas, r, n2, ...p3), fa(e2.roleCanvas, p3, r, "line"), e2.canvas = Ue(e2.canvas, r, n2, ...o), fa(e2.roleCanvas, o, r, "corner"), e2.canvas = Ue(e2.canvas, r, n2, ...d2), fa(e2.roleCanvas, d2, r, "junction"), e2.canvas = Ue(e2.canvas, r, n2, ...s), fa(e2.roleCanvas, s, r, "arrow"), e2.canvas = Ue(e2.canvas, r, n2, ...l), fa(e2.roleCanvas, l, r, "junction"), e2.canvas = Ue(e2.canvas, r, n2, ...c), fa(e2.roleCanvas, c, r, "arrow"), e2.canvas = Ue(e2.canvas, r, n2, ...u3), fa(e2.roleCanvas, u3, r, "text");
  for (let e3 of u3) {
    let n3 = pa(e3);
    n3 && t2.push(n3);
  }
  for (let r2 of e2.subgraphs) {
    if (r2.nodes.length === 0) continue;
    let [i2, a3, o2] = Fn(r2, e2, (t3, n3) => jn(e2.canvas[t3 + r2.minX]?.[n3 + r2.minY]) && (e2.canvas[t3 + r2.minX]?.[n3 + r2.minY + 1] ?? " ") !== " ");
    e2.canvas = Ue(e2.canvas, a3, n2, i2), da(e2.roleCanvas, i2, a3, "text");
    let s2 = pa(i2);
    s2 && t2.push({
      x0: s2.x0 + a3.x,
      x1: s2.x1 + a3.x,
      y0: s2.y0 + a3.y,
      y1: s2.y1 + a3.y
    });
    for (let { x: t3, y: n3 } of o2) {
      let r3 = i2[t3]?.[n3];
      r3 === " " && (G(e2.canvas, t3 + a3.x, n3 + a3.y, r3), Pe2(e2.roleCanvas, t3 + a3.x, n3 + a3.y, "text"));
    }
  }
  return e2.canvas;
}
function ga(e2, t2, n2, r) {
  if (r(e2)) return e2;
  let i = Math.max(e2 - t2, n2 - e2);
  for (let a2 = 1; a2 <= i; a2++) {
    let i2 = e2 + a2;
    if (i2 <= n2 && r(i2)) return i2;
    let o = e2 - a2;
    if (o >= t2 && r(o)) return o;
  }
}
function _a(e2) {
  let t2 = e2.keys.length > 0 ? " " + e2.keys.join(",") : "";
  return `${e2.type} ${e2.name}${t2}`;
}
function va(e2) {
  let t2 = Q(e2.label), n2 = e2.attributes.map(_a);
  return n2.length === 0 ? [t2] : [t2, n2];
}
function ya(e2, t2, n2 = false, r = false) {
  if (t2) switch (e2) {
    case "one":
      return r ? "+" : "|";
    case "zero-one":
      return n2 ? "o|" : "|o";
    case "many":
      return n2 ? "<" : ">";
    case "zero-many":
      return n2 ? "o<" : ">o";
  }
  else switch (e2) {
    case "one":
      return r ? "\u253C" : "\u2502";
    case "zero-one":
      return n2 ? "\u25CB\u2502" : "\u2502\u25CB";
    case "many":
      return n2 ? "\u255F" : "\u2562";
    case "zero-many":
      return n2 ? "\u25CB\u255F" : "\u2562\u25CB";
  }
}
function ba(e2) {
  let t2 = /* @__PURE__ */ new Set(), n2 = [], r = /* @__PURE__ */ new Map();
  for (let t3 of e2.entities) r.set(t3.id, /* @__PURE__ */ new Set());
  for (let t3 of e2.relationships) r.get(t3.entity1)?.add(t3.entity2), r.get(t3.entity2)?.add(t3.entity1);
  function i(e3, n3) {
    let i2 = [e3];
    for (; i2.length > 0; ) {
      let e4 = i2.pop();
      if (!t2.has(e4)) {
        t2.add(e4), n3.add(e4);
        for (let n4 of r.get(e4) ?? []) t2.has(n4) || i2.push(n4);
      }
    }
  }
  for (let r2 of e2.entities) if (!t2.has(r2.id)) {
    let e3 = /* @__PURE__ */ new Set();
    i(r2.id, e3), e3.size > 0 && n2.push(e3);
  }
  return n2;
}
function xa(e2, t2, n2) {
  let r = e2.get(t2);
  if (r === void 0)
    throw Error(`ER diagram layout: missing ${n2} for entity "${t2}"`);
  return r;
}
function Sa(e2, t2, n2, r) {
  let i = _(e2), a2 = N(i);
  if (a2.entities.length === 0) return "";
  let o = t2.useAscii, s = It(t2.paddingX, 5, 6, 6), c = It(t2.paddingY, 5, 4, 2), l = It(t2.paddingY, 5, 2, 1), d2 = Math.max(...[
    "one",
    "zero-one",
    "many",
    "zero-many"
  ].flatMap((e3) => [ya(e3, o, false).length, ya(e3, o, true).length])), f2 = /* @__PURE__ */ new Map(), p3 = /* @__PURE__ */ new Map(), m3 = /* @__PURE__ */ new Map(), h3 = /* @__PURE__ */ new Map();
  for (let e3 of a2.entities) {
    h3.set(e3.id, e3);
    let n3 = va(e3);
    f2.set(e3.id, n3);
    let { width: r2, height: i2 } = ca(n3, t2.boxBorderPadding);
    p3.set(e3.id, r2), m3.set(e3.id, i2);
  }
  let g3 = /* @__PURE__ */ new Map();
  for (let e3 of a2.relationships) {
    if (!e3.label) continue;
    let t3 = [e3.entity1, e3.entity2].sort().join("|"), n3 = Dn(e3.label);
    g3.set(t3, Math.max(g3.get(t3) ?? 0, n3));
  }
  let _3 = ba(a2), v2 = /* @__PURE__ */ new Map(), y3 = 0;
  for (let e3 of _3) {
    let t3 = a2.entities.filter((t4) => e3.has(t4.id)), n3 = Math.max(2, Math.ceil(Math.sqrt(t3.length))), r2 = 0, i2 = 0, o2 = 0;
    for (let e4 = 0; e4 < t3.length; e4++) {
      let a3 = t3[e4], l2 = xa(p3, a3.id, "box width"), u3 = xa(m3, a3.id, "box height");
      o2 >= n3 && (y3 += i2 + c, r2 = 0, i2 = 0, o2 = 0), v2.set(a3.id, {
        entity: a3,
        sections: xa(f2, a3.id, "sections"),
        x: r2,
        y: y3,
        width: l2,
        height: u3
      });
      let d3 = s, h4 = o2 + 1 >= n3, _4 = t3[e4 + 1];
      if (!h4 && _4) {
        let e5 = [a3.id, _4.id].sort().join("|"), t4 = g3.get(e5) ?? 0;
        t4 > 0 && (d3 = Math.max(d3, t4 + 2));
      }
      r2 += l2 + d3, i2 = Math.max(i2, u3), o2++;
    }
    y3 += i2 + l;
  }
  let b3 = 0, x3 = 0;
  for (let e3 of v2.values()) b3 = Math.max(b3, e3.x + e3.width), x3 = Math.max(x3, e3.y + e3.height);
  b3 += 4, x3 += 2;
  let S3 = U2(b3 - 1, x3 - 1), C3 = Me2(b3 - 1, x3 - 1);
  function ee3(e3, t3, n3, r2) {
    G(S3, e3, t3, n3, {
      role: r2,
      roleCanvas: C3
    });
  }
  function w2(e3, t3) {
    let n3 = C3[e3]?.[t3];
    return n3 === "text" || n3 === "border";
  }
  function T3(e3, t3, n3, r2, i2) {
    for (let a3 = 0; a3 < e3.length; a3++) {
      let e4 = t3 + a3;
      if (!(e4 < r2 || e4 > i2) && w2(e4, n3)) return false;
    }
    return true;
  }
  function E2(e3, t3, n3, r2, i2, a3) {
    for (let a4 = 0; a4 < e3.length; a4++) {
      let e4 = t3 + a4;
      if (!(e4 < r2 || e4 > i2) && (w2(e4, n3) || C3[e4]?.[n3] === "arrow" || D3.has(`${e4},${n3}`))) return false;
    }
    if (!a3) return true;
    for (let a4 = t3 - 2; a4 <= t3 + e3.length; a4++) if (!(a4 < r2 - 2 || a4 > i2 + 1) && C3[a4]?.[n3] === "line" && !le3.has(`${a4},${n3}`)) return false;
    return true;
  }
  for (let e3 of v2.values()) {
    let n3 = la(e3.sections, o, t2.boxBorderPadding);
    for (let t3 = 0; t3 < n3.length; t3++) for (let r2 = 0; r2 < n3[0].length; r2++) {
      let i2 = n3[t3][r2];
      if (i2 !== " ") {
        let n4 = e3.x + t3, a3 = e3.y + r2;
        n4 < b3 && a3 < x3 && ee3(n4, a3, i2, sa(i2));
      }
    }
  }
  let D3 = /* @__PURE__ */ new Set();
  for (let e3 of v2.values()) for (let t3 = 0; t3 < e3.height; t3++) for (let n3 = 0; n3 < e3.width; n3++) D3.add(`${e3.x + n3},${e3.y + t3}`);
  function O3(e3, t3, n3, r2) {
    D3.has(`${e3},${t3}`) || (r2 === "text" || C3[e3]?.[t3] !== "text") && (oe3(n3) !== "dashed" || oe3(S3[e3]?.[t3]) !== "solid") && (ee3(e3, t3, n3, r2), r2 === "line" && le3.add(`${e3},${t3}`));
  }
  function te3(e3, t3, n3, r2) {
    C3[e3 - 1]?.[t3] !== "text" && C3[e3 + 1]?.[t3] !== "text" && O3(e3, t3, n3, r2);
  }
  function ne3(e3, t3, n3, r2) {
    for (let i2 = n3; i2 <= r2; i2++) for (let n4 = e3; n4 <= t3; n4++) {
      let e4 = S3[n4]?.[i2];
      if (e4 !== void 0 && e4 !== " ") return false;
    }
    return true;
  }
  let A3 = [];
  function re3(e3, t3, n3) {
    for (let r2 of A3) if (Math.abs(r2.x - e3) === 1 && t3 <= r2.yEnd && n3 >= r2.yStart) return true;
    return false;
  }
  function j3(e3, t3, n3) {
    for (let r2 of A3) if (!(Math.abs(r2.x - e3) > 1) && t3 <= r2.yEnd && n3 >= r2.yStart) return true;
    return false;
  }
  function ie4(e3, t3, n3) {
    A3.push({
      x: e3,
      yStart: t3,
      yEnd: n3
    });
  }
  let M4 = o ? "-" : "\u2500", ae3 = o ? "|" : "\u2502", N3 = o ? "." : "\u254C", P3 = o ? ":" : "\u250A";
  function oe3(e3) {
    if (e3 === M4 || e3 === ae3) return "solid";
    if (e3 === N3 || e3 === P3) return "dashed";
  }
  function F3(e3, t3) {
    return o ? "+" : e3 === "down" ? t3 === "right" ? "\u250C" : "\u2510" : t3 === "right" ? "\u2514" : "\u2518";
  }
  function I3(e3, t3, n3, r2) {
    O3(e3, t3, F3(n3, r2), "line");
  }
  let L3 = /* @__PURE__ */ new Map(), se3 = /* @__PURE__ */ new Map();
  for (let e3 of a2.relationships) {
    let t3 = v2.get(e3.entity1), n3 = v2.get(e3.entity2);
    if (!t3 || !n3) continue;
    let r2 = t3.y + Math.floor(t3.height / 2), i2 = n3.y + Math.floor(n3.height / 2);
    if (Math.abs(r2 - i2) < Math.max(t3.height, n3.height)) continue;
    let [a3, o2] = r2 < i2 ? [t3, n3] : [n3, t3], s2 = a3.x + Math.floor(a3.width / 2), c2 = o2.x + Math.floor(o2.width / 2), l2 = se3.get(a3.entity.id);
    l2 || (l2 = [], se3.set(a3.entity.id, l2)), l2.push({
      rel: e3,
      otherCenterX: c2
    });
    let u3 = L3.get(o2.entity.id);
    u3 || (u3 = [], L3.set(o2.entity.id, u3)), u3.push({
      rel: e3,
      otherCenterX: s2
    });
  }
  function ce3(e3, t3, n3) {
    let r2 = n3.get(e3.entity.id), i2 = e3.x + Math.floor(e3.width / 2);
    if (!r2 || r2.length <= 1) return i2;
    let a3 = [...r2].sort((e4, t4) => e4.otherCenterX - t4.otherCenterX), o2 = a3.findIndex((e4) => e4.rel === t3);
    if (o2 === -1) return i2;
    let s2 = Math.min(1, Math.floor((e3.width - 1) / 2)), c2 = Math.max(0, e3.width - 1 - s2 * 2), l2 = a3.length > 1 ? c2 / (a3.length - 1) : 0;
    return e3.x + s2 + Math.round(o2 * l2);
  }
  let le3 = /* @__PURE__ */ new Set();
  for (let e3 of a2.relationships) {
    le3 = /* @__PURE__ */ new Set();
    let t3 = v2.get(e3.entity1), n3 = v2.get(e3.entity2);
    if (!t3 || !n3) continue;
    let r2 = e3.identifying ? M4 : N3, i2 = e3.identifying ? ae3 : P3, a3 = t3.x + Math.floor(t3.width / 2), s2 = t3.y + Math.floor(t3.height / 2), l2 = n3.x + Math.floor(n3.width / 2), u3 = n3.y + Math.floor(n3.height / 2);
    if (Math.abs(s2 - u3) < Math.max(t3.height, n3.height)) {
      let [s3, u4] = a3 < l2 ? [t3, n3] : [n3, t3], [f3, p4] = a3 < l2 ? [e3.cardinality1, e3.cardinality2] : [e3.cardinality2, e3.cardinality1], m4 = s3.x + s3.width, h4 = u4.x - 1, g4 = s3.y + Math.floor(s3.height / 2), _4;
      for (let e4 of v2.values()) e4 !== s3 && e4 !== u4 && e4.y === s3.y && e4.x < h4 + 1 && e4.x + e4.width > m4 && (_4 = Math.max(_4 ?? 0, e4.y + e4.height));
      let y4 = h4 - m4 + 1, b4 = +(y4 >= d2 + 1), x4 = ya(f3, o, false), ee4 = ya(p4, o, true), w3 = +(y4 >= 3 && x4[0] === ae3), E3 = +(y4 >= 3 && ee4[ee4.length - 1] === ae3), D4 = m4 + w3, k3 = h4 - E3, A4;
      if (_4 === void 0) {
        for (let e4 = m4; e4 <= h4; e4++) te3(e4, g4, r2, "line");
        if (A4 = g4 + 1, e3.label) {
          let t4 = m4 + b4, n4 = h4 - b4, r3 = Q(e3.label).length, i3 = g4 + 1 + Math.max(c - 1, 1);
          for (; A4 < i3 && !ne3(t4, n4, A4, A4 + r3 - 1); ) A4++;
        }
      } else {
        let t4 = Math.max(s3.y + s3.height, u4.y + u4.height, _4), n4 = e3.label ? Q(e3.label).length : 0, a4 = t4 + 1, o2 = t4 + Math.max(c * 3, 4);
        for (; a4 < o2 && !ne3(m4, h4, a4, a4 + n4); ) a4++;
        Ie2(S3, h4 + 1, a4 + n4 + 1), Ne2(C3, h4 + 1, a4 + n4 + 1);
        for (let e4 = g4; e4 <= a4; e4++) O3(m4, e4, i2, "line"), O3(h4, e4, i2, "line");
        for (let e4 = m4; e4 <= h4; e4++) te3(e4, a4, r2, "line");
        m4 !== h4 && (I3(m4, a4, "up", "right"), I3(h4, a4, "up", "left")), A4 = a4 + 1;
      }
      for (let e4 = 0; e4 < x4.length; e4++) O3(D4 + e4, g4, x4[e4], "arrow");
      for (let e4 = 0; e4 < ee4.length; e4++) O3(k3 - ee4.length + 1 + e4, g4, ee4[e4], "arrow");
      if (e3.label) {
        let t4 = Q(e3.label), n4 = Math.floor((m4 + h4) / 2), r3 = m4 + b4, i3 = h4 - b4;
        for (let e4 = 0; e4 < t4.length; e4++) {
          let a4 = t4[e4], o2 = je2(a4), s4 = Math.max(r3, n4 - Math.floor(o2.length / 2)), c2 = A4 + e4;
          if (Ie2(S3, Math.max(s4 + o2.length, 1), Math.max(c2 + 1, 1)), Ne2(C3, Math.max(s4 + o2.length, 1), Math.max(c2 + 1, 1)), T3(o2, s4, c2, r3, i3)) for (let e5 = 0; e5 < o2.length; e5++) {
            let t5 = s4 + e5;
            t5 >= r3 && t5 <= i3 && O3(t5, c2, o2[e5], "text");
          }
        }
      }
    } else {
      let g4 = function(e4, t4, n4) {
        for (let r3 = t4; r3 <= n4; r3++) if (D3.has(`${e4},${r3}`)) return false;
        return true;
      }, k3 = function(e4, t4, n4) {
        let r3 = Math.floor(w3 <= T4 ? (w3 + T4) / 2 : (f3 + p4) / 2);
        if (w3 > T4) return r3;
        for (let r4 = w3; r4 <= T4; r4++) if (ne3(e4, t4, r4, r4 + n4)) return r4;
        return r3;
      };
      let [a4, c2] = s2 < u3 ? [t3, n3] : [n3, t3], [l3, d3] = s2 < u3 ? [e3.cardinality1, e3.cardinality2] : [e3.cardinality2, e3.cardinality1], f3 = a4.y + a4.height, p4 = c2.y - 1, m4 = ce3(a4, e3, se3), h4 = ce3(c2, e3, L3);
      let _4 = f3, y4 = p4, b4 = Math.max(...[...v2.values()].filter((e4) => e4.y === a4.y).map((e4) => e4.y + e4.height)), x4 = c2.y, w3 = Math.max(f3, b4 + 1), T4 = Math.min(p4, x4 - 1);
      let A4 = m4 !== h4, M5 = Math.min(m4, h4), ae4 = Math.max(m4, h4), N4 = A4 ? k3(M5, ae4, 0) : p4, P4 = A4 ? N4 - 1 : p4, oe4 = !g4(m4, w3, T4) || !g4(h4, w3, T4) || re3(m4, f3, A4 ? N4 : p4) || A4 && re3(h4, N4, p4), F4 = m4;
      if (oe4) {
        let e4 = S3.length, t4;
        for (let n4 = 0; n4 <= e4; n4++) {
          let e5 = m4 + n4;
          if (g4(e5, f3, p4) && !j3(e5, f3, p4)) {
            t4 = e5;
            break;
          }
          let r3 = m4 - n4;
          if (n4 > 0 && g4(r3, f3, p4) && !j3(r3, f3, p4)) {
            t4 = r3;
            break;
          }
        }
        F4 = t4 ?? m4;
        for (let e5 = f3; e5 <= _4; e5++) O3(m4, e5, i2, "line");
        for (let e5 = Math.min(m4, F4); e5 <= Math.max(m4, F4); e5++) te3(e5, _4, r2, "line");
        for (let e5 = _4; e5 <= y4; e5++) O3(F4, e5, i2, "line");
        for (let e5 = Math.min(F4, h4); e5 <= Math.max(F4, h4); e5++) te3(e5, y4, r2, "line");
        for (let e5 = y4; e5 <= p4; e5++) O3(h4, e5, i2, "line");
        if (m4 !== F4) {
          let e5 = F4 > m4 ? "right" : "left", t5 = e5 === "right" ? "left" : "right";
          I3(m4, _4, "up", e5), I3(F4, _4, "down", t5);
        }
        if (F4 !== h4) {
          let e5 = h4 > F4 ? "right" : "left", t5 = e5 === "right" ? "left" : "right";
          I3(F4, y4, "up", e5), I3(h4, y4, "down", t5);
        }
        ie4(F4, _4, y4);
      } else {
        for (let e4 = f3; e4 <= P4; e4++) O3(m4, e4, i2, "line");
        if (ie4(m4, f3, A4 ? N4 : P4), A4) {
          for (let e5 = M5; e5 <= ae4; e5++) te3(e5, N4, r2, "line");
          for (let e5 = N4 + 1; e5 <= p4; e5++) O3(h4, e5, i2, "line");
          ie4(h4, N4, p4);
          let e4 = h4 > m4 ? "right" : "left", t4 = e4 === "right" ? "left" : "right";
          I3(m4, N4, "up", e4), I3(h4, N4, "down", t4), F4 = h4;
        }
      }
      let le4 = ya(l3, o, false, true);
      for (let e4 = 0; e4 < le4.length; e4++) O3(m4 - Math.floor(le4.length / 2) + e4, _4, le4[e4], "arrow");
      let R3 = m4 === h4 ? m4 : h4, z3 = ya(d3, o, true, true);
      for (let e4 = 0; e4 < z3.length; e4++) O3(R3 - Math.floor(z3.length / 2) + e4, y4, z3[e4], "arrow");
      if (e3.label) {
        let t4 = Q(e3.label), n4 = Math.max(le4.length - 1 - Math.floor(le4.length / 2), z3.length - 1 - Math.floor(z3.length / 2)), r3 = F4 + n4 + 2, i3 = t4.map((e4) => je2(e4)), a5 = r3 + Math.max(...i3.map((e4) => e4.length)) - 1, o2 = t4.length, s3 = Math.floor((f3 + p4) / 2) - Math.floor((o2 - 1) / 2);
        a5 >= 0 && (Ie2(S3, a5 + 1, p4 + 1), Ne2(C3, a5 + 1, p4 + 1));
        let c3 = null;
        for (let e4 of [true, false]) {
          for (let t5 = 0; t5 <= p4 - f3 && c3 === null; t5++) {
            let n5 = t5 === 0 ? [s3] : [s3 + t5, s3 - t5];
            for (let t6 of n5) if (!(t6 < f3 || t6 + o2 - 1 > p4) && i3.every((n6, i4) => E2(n6, r3, t6 + i4, 0, a5, e4))) {
              c3 = t6;
              break;
            }
          }
          if (c3 !== null) break;
        }
        if (c3 !== null) for (let e4 = 0; e4 < o2; e4++) {
          let t5 = i3[e4], n5 = c3 + e4;
          for (let e5 = 0; e5 < t5.length; e5++) {
            let i4 = r3 + e5;
            i4 >= 0 && O3(i4, n5, t5[e5], "text");
          }
          C3[r3 - 1]?.[n5] === "line" && ee3(r3 - 1, n5, " ", "line");
          let a6 = r3 + t5.length;
          C3[a6]?.[n5] === "line" && ee3(a6, n5, " ", "line");
        }
      }
    }
  }
  return We(S3, {
    roleCanvas: C3,
    colorMode: n2,
    theme: r
  });
}
var Ca = 4;
var wa = [
  "O",
  "/|\\",
  "/ \\"
];
var Ta = 3;
var Ea = 4;
function Da(e2) {
  return e2.seqNumber === void 0 ? Ca : Ca + String(e2.seqNumber).length;
}
function Oa(e2, t2, n2, r) {
  let i = _(e2), a2 = B(i);
  if (a2.actors.length === 0) return "";
  let o = t2.useAscii, s = o ? "-" : "\u2500", c = o ? "|" : "\u2502", l = o ? "+" : "\u250C", d2 = o ? "+" : "\u2510", f2 = o ? "+" : "\u2514", p3 = o ? "+" : "\u2518", m3 = o ? "+" : "\u252C", h3 = o ? "+" : "\u2534", g3 = o ? "+" : "\u251C", _3 = o ? "+" : "\u2524", v2 = o ? "\u2016" : "\u2551", y3 = /* @__PURE__ */ new Map();
  a2.actors.forEach((e3, t3) => y3.set(e3.id, t3));
  function b3(e3) {
    let t3 = y3.get(e3);
    if (t3 === void 0)
      throw Error(`Sequence diagram: unknown actor "${e3}"`);
    return t3;
  }
  function x3(e3) {
    let t3 = Dn(e3.label ? `${e3.type} [${e3.label}]` : e3.type);
    for (let n3 of e3.dividers) n3.label && (t3 = Math.max(t3, Dn(`[${n3.label}]`)));
    return t3;
  }
  let S3 = Math.max(0, t2.boxBorderPadding), C3 = (e3) => Math.max(Dn(e3.label), e3.type === "actor" ? Ta : 0), ee3 = (e3) => On(e3.label) + (e3.type === "actor" ? wa.length : 0), w2 = a2.actors.map((e3) => C3(e3) + 2 * S3 + 2), T3 = w2.map((e3) => Math.ceil(e3 / 2)), E2 = a2.actors.map((e3) => ee3(e3) + 2), D3 = Math.max(...E2, 3), O3 = (e3, t3) => t3 - Math.floor(w2[e3] / 2), k3 = Math.floor((D3 - 1) / 2), te3 = D3 - 1 - k3, A3 = /* @__PURE__ */ new Map(), re3 = /* @__PURE__ */ new Map();
  a2.actors.forEach((e3, t3) => {
    e3.createdAt !== void 0 && A3.set(e3.createdAt, t3), e3.destroyedAt !== void 0 && re3.set(e3.destroyedAt, t3);
  });
  let j3 = /* @__PURE__ */ new Map(), ie4 = /* @__PURE__ */ new Map(), M4 = a2.boxes.filter((e3) => e3.actorIds.length > 0).map((e3) => {
    let t3 = e3.actorIds.map(b3);
    return {
      label: e3.label,
      lo: Math.min(...t3),
      hi: Math.max(...t3)
    };
  }), ae3 = M4.length > 0, N3 = a2.actors.map((e3, t3) => M4.findIndex((e4) => e4.lo <= t3 && t3 <= e4.hi)), P3 = +!!ae3, oe3 = (e3) => e3 === "" ? 0 : Dn(e3) + 6, F3 = Array(Math.max(a2.actors.length - 1, 0)).fill(0);
  for (let e3 of a2.messages) {
    let t3 = b3(e3.from), n3 = b3(e3.to);
    if (t3 === n3) continue;
    let r2 = Math.min(t3, n3), i2 = Math.max(t3, n3), a3 = Dn(e3.label) + 4, o2 = i2 - r2, s2 = Math.ceil(a3 / o2);
    for (let e4 = r2; e4 < i2; e4++) F3[e4] = Math.max(F3[e4], s2);
  }
  function I3(e3) {
    let t3 = Q(e3.text);
    return Math.max(...t3.map((e4) => H2(e4))) + 2 + 2 * S3;
  }
  let L3 = Array(a2.actors.length).fill(0), se3 = Array(a2.actors.length).fill(0), ce3 = Array(a2.actors.length).fill(0), le3 = Array(a2.actors.length).fill(0);
  for (let e3 of a2.notes) if (e3.position === "left" || e3.position === "right") {
    let t3 = b3(e3.actorIds[0]), n3 = I3(e3);
    e3.position === "left" ? L3[t3] = Math.max(L3[t3], n3) : se3[t3] = Math.max(se3[t3], n3);
  } else if (e3.position === "over" && e3.actorIds.length === 1) {
    let t3 = b3(e3.actorIds[0]), n3 = I3(e3), r2 = Math.floor(n3 / 2), i2 = n3 - r2;
    ce3[t3] = Math.max(ce3[t3], r2), le3[t3] = Math.max(le3[t3], i2);
  }
  let R3 = It(t2.paddingX, 5, 10, 4), z3 = [Math.max(T3[0] + (N3[0] === -1 ? 0 : 2), L3[0] + 1, ce3[0])];
  for (let e3 = 1; e3 < a2.actors.length; e3++) {
    let t3 = N3[e3 - 1], n3 = N3[e3], r2 = t3 === n3 ? 0 : (t3 === -1 ? 0 : 1) + (n3 === -1 ? 0 : 1), i2 = r2 === 0 ? 0 : r2 * 2 - 1, a3 = Math.max(se3[e3 - 1], L3[e3], le3[e3 - 1], ce3[e3]) + 2, o2 = Math.max(T3[e3 - 1] + T3[e3] + 2 + i2, F3[e3 - 1] + 2, a3, R3);
    z3[e3] = z3[e3 - 1] + o2;
  }
  let ue2 = (e3) => O3(e3.lo, z3[e3.lo]) - 1 - 1, de3 = (e3) => Math.max(O3(e3.hi, z3[e3.hi]) + w2[e3.hi] - 1 + 1 + 1, ue2(e3) + oe3(e3.label) - 1);
  for (let e3 of M4) {
    if (e3.hi + 1 >= a2.actors.length) continue;
    let t3 = O3(e3.hi + 1, z3[e3.hi + 1]), n3 = N3[e3.hi + 1] === -1 ? 0 : 2, r2 = de3(e3) + 1 + 1 + n3 - t3;
    if (r2 > 0) {
      let t4 = z3.slice(e3.hi + 1).map((e4) => e4 + r2);
      z3.splice(e3.hi + 1, t4.length, ...t4);
    }
  }
  for (let e3 of a2.blocks) {
    let t3 = -1, n3 = -1, r2 = Infinity, i2 = -1;
    for (let o3 = e3.startIndex; o3 <= e3.endIndex && !(o3 >= a2.messages.length); o3++) {
      let e4 = a2.messages[o3], s3 = b3(e4.from), c3 = b3(e4.to);
      if (t3 = t3 === -1 ? Math.min(s3, c3) : Math.min(t3, s3, c3), n3 = Math.max(n3, s3, c3), r2 = Math.min(r2, z3[Math.min(s3, c3)]), i2 = Math.max(i2, z3[Math.max(s3, c3)]), s3 === c3) {
        let t4 = z3[s3] + Ca + 2 + Dn(e4.label);
        i2 = Math.max(i2, t4);
      }
    }
    if (n3 === -1 || n3 + 1 >= a2.actors.length) continue;
    let o2 = Math.max(0, r2 - Ea), s2 = i2 + Ea, c2 = o2 + 1 + x3(e3), l2 = Math.max(s2, c2), u3 = z3[n3 + 1], d3 = l2 + 2 - u3;
    if (d3 > 0) {
      let e4 = z3.slice(n3 + 1).map((e5) => e5 + d3);
      z3.splice(n3 + 1, e4.length, ...e4);
    }
  }
  let fe3 = [], pe4 = [], me3 = /* @__PURE__ */ new Map(), he4 = /* @__PURE__ */ new Map(), ge4 = /* @__PURE__ */ new Map(), _e3 = [], ve3 = P3, ye3 = ve3 + D3, B3 = ye3 + P3, be4 = It(t2.paddingY, 5, 1, 0), xe4 = Math.max(be4, 1);
  for (let e3 of a2.notes) {
    if (e3.afterIndex !== -1) continue;
    B3 += be4;
    let t3 = Q(e3.text), n3 = I3(e3), r2 = t3.length + 2, i2 = y3.get(e3.actorIds[0]) ?? 0, a3;
    if (e3.position === "left") a3 = z3[i2] - n3 - 1;
    else if (e3.position === "right") a3 = z3[i2] + 2;
    else if (e3.actorIds.length >= 2) {
      let t4 = y3.get(e3.actorIds[1]) ?? i2;
      a3 = Math.floor((z3[i2] + z3[t4]) / 2) - Math.floor(n3 / 2);
    } else a3 = z3[i2] - Math.floor(n3 / 2);
    a3 = Math.max(0, a3), _e3.push({
      x: a3,
      y: B3,
      width: n3,
      height: r2,
      lines: t3
    }), B3 += r2;
  }
  for (let e3 = 0; e3 < a2.messages.length; e3++) {
    for (let t4 = 0; t4 < a2.blocks.length; t4++) a2.blocks[t4].startIndex === e3 && (B3 += be4 + 1, me3.set(t4, B3 - 1));
    for (let t4 = 0; t4 < a2.blocks.length; t4++) for (let n4 = 0; n4 < a2.blocks[t4].dividers.length; n4++) a2.blocks[t4].dividers[n4].index === e3 && (B3 += be4, ge4.set(`${t4}:${n4}`, B3), B3 += xe4);
    B3 += be4;
    let t3 = a2.messages[e3], n3 = t3.from === t3.to, r2 = On(t3.label), i2 = n3 ? void 0 : A3.get(e3), o2 = re3.get(e3);
    if (n3) pe4[e3] = B3 + 1, fe3[e3] = B3, B3 += 2 + r2;
    else {
      let t4 = i2 === void 0 ? 0 : k3, n4 = i2 === void 0 ? 0 : te3;
      pe4[e3] = B3, fe3[e3] = B3 + r2 + t4, B3 += r2 + t4 + 1 + n4, i2 !== void 0 && j3.set(i2, fe3[e3] - t4);
    }
    o2 !== void 0 && (ie4.set(o2, B3), B3 += 1);
    for (let t4 = 0; t4 < a2.notes.length; t4++) if (a2.notes[t4].afterIndex === e3) {
      B3 += be4;
      let e4 = a2.notes[t4], n4 = Q(e4.text), r3 = I3(e4), i3 = n4.length + 2, o3 = y3.get(e4.actorIds[0]) ?? 0, s2;
      if (e4.position === "left") s2 = z3[o3] - r3 - 1;
      else if (e4.position === "right") s2 = z3[o3] + 2;
      else if (e4.actorIds.length >= 2) {
        let t5 = y3.get(e4.actorIds[1]) ?? o3;
        s2 = Math.floor((z3[o3] + z3[t5]) / 2) - Math.floor(r3 / 2);
      } else s2 = z3[o3] - Math.floor(r3 / 2);
      s2 = Math.max(0, s2), _e3.push({
        x: s2,
        y: B3,
        width: r3,
        height: i3,
        lines: n4
      }), B3 += i3;
    }
    for (let t4 = 0; t4 < a2.blocks.length; t4++) a2.blocks[t4].endIndex === e3 && (B3 += be4, he4.set(t4, B3), B3 += xe4);
  }
  B3 += xe4;
  let Se4 = B3, Ce4 = Se4 + P3, we4 = Ce4 + D3 + P3, Te3 = (z3[z3.length - 1] ?? 0) + (T3[T3.length - 1] ?? 0) + 2;
  for (let e3 of M4) Te3 = Math.max(Te3, de3(e3) + 2);
  for (let e3 = 0; e3 < a2.messages.length; e3++) {
    let t3 = a2.messages[e3];
    if (t3.from === t3.to) {
      let e4 = z3[b3(t3.from)] + Da(t3) + 2 + 2 + Dn(t3.label);
      Te3 = Math.max(Te3, e4 + 1);
    }
  }
  for (let e3 of _e3) Te3 = Math.max(Te3, e3.x + e3.width + 1);
  let Ee3 = U2(Te3, we4 - 1), De3 = Me2(Te3, we4 - 1);
  function V3(e3, t3, n3, r2) {
    G(Ee3, e3, t3, n3, {
      role: r2,
      roleCanvas: De3
    });
  }
  function Oe3(e3, t3, n3, r2, i2) {
    let a3 = je2(n3);
    for (let n4 = 0; n4 < a3.length; n4++) {
      let o2 = e3 + n4;
      if (i2 !== void 0 && o2 >= i2 || a3[n4 + 1] === "" && i2 !== void 0 && o2 + 1 >= i2) break;
      V3(o2, t3, a3[n4], r2);
    }
  }
  function ke3(e3, t3, n3, r2, i2) {
    let a3 = r2 === "actor" ? wa : [], o2 = [...a3, ...Q(n3)], u3 = Math.max(Dn(n3), a3.length > 0 ? Ta : 0), m4 = u3 + 2 * S3 + 2, h4 = i2, g4 = h4 - 2, _4 = e3 - Math.floor(m4 / 2);
    V3(_4, t3, l, "border");
    for (let e4 = 1; e4 < m4 - 1; e4++) V3(_4 + e4, t3, s, "border");
    V3(_4 + m4 - 1, t3, d2, "border");
    for (let e4 = 0; e4 < g4; e4++) {
      let n4 = t3 + 1 + e4;
      V3(_4, n4, c, "border"), V3(_4 + m4 - 1, n4, c, "border");
      let r3 = o2[e4];
      r3 !== void 0 && Oe3(_4 + 1 + S3 + Math.floor((u3 - H2(r3)) / 2), n4, r3, "text");
    }
    let v3 = t3 + h4 - 1;
    V3(_4, v3, f2, "border");
    for (let e4 = 1; e4 < m4 - 1; e4++) V3(_4 + e4, v3, s, "border");
    V3(_4 + m4 - 1, v3, p3, "border");
  }
  let Ae2 = (e3) => {
    let t3 = j3.get(e3);
    return t3 === void 0 ? ye3 : t3 + D3;
  }, W2 = (e3) => ie4.get(e3) ?? Se4, Pe3 = /* @__PURE__ */ new Map(), Le3 = /* @__PURE__ */ new Map();
  function Re3(e3, t3) {
    let n3 = Le3.get(e3) ?? [];
    Le3.set(e3, n3), n3.push(t3);
  }
  function ze3(e3, t3) {
    let n3 = Le3.get(e3)?.pop();
    if (n3 === void 0) return;
    let r2 = Pe3.get(e3) ?? [];
    Pe3.set(e3, r2), r2.push({
      topRow: n3,
      bottomRow: t3
    });
  }
  let Be3 = /* @__PURE__ */ new Map();
  for (let e3 of a2.activations) {
    let t3 = Be3.get(e3.afterIndex) ?? [];
    t3.push(e3), Be3.set(e3.afterIndex, t3);
  }
  function Ve3(e3, t3) {
    for (let n3 of Be3.get(e3) ?? []) n3.kind === "start" ? Re3(n3.actorId, t3) : ze3(n3.actorId, t3);
  }
  Ve3(-1, ye3);
  for (let e3 = 0; e3 < a2.messages.length; e3++) {
    let t3 = a2.messages[e3], n3 = fe3[e3];
    t3.activate && Re3(t3.to, n3), t3.deactivate && ze3(t3.from, n3), Ve3(e3, n3);
  }
  for (let [e3, t3] of Le3) {
    if (t3.length === 0) continue;
    let n3 = W2(b3(e3)), r2 = Pe3.get(e3) ?? [];
    Pe3.set(e3, r2);
    for (let e4 of t3) r2.push({
      topRow: e4,
      bottomRow: n3
    });
  }
  function He3(e3, t3) {
    let n3 = Pe3.get(e3);
    return n3 ? n3.some((e4) => t3 >= e4.topRow && t3 <= e4.bottomRow) : false;
  }
  for (let e3 = 0; e3 < a2.actors.length; e3++) {
    let t3 = z3[e3], n3 = a2.actors[e3].id;
    for (let r2 = Ae2(e3); r2 <= W2(e3); r2++) V3(t3, r2, He3(n3, r2) ? v2 : c, "line");
  }
  let Ue2 = o ? "+" : "\u253C";
  function Ge2(e3, t3, n3) {
    let r2 = ue2(e3), i2 = de3(e3), a3 = t3 + D3 + 1;
    V3(r2, t3, l, "border"), V3(i2, t3, d2, "border"), V3(r2, a3, f2, "border"), V3(i2, a3, p3, "border");
    for (let e4 = r2 + 1; e4 < i2; e4++) V3(e4, t3, s, "border"), V3(e4, a3, s, "border");
    for (let e4 = t3 + 1; e4 < a3; e4++) V3(r2, e4, c, "border"), V3(i2, e4, c, "border");
    n3 !== "" && Oe3(r2 + 2, t3, ` ${Q(n3)[0]} `, "text");
    for (let n4 = e3.lo; n4 <= e3.hi; n4++) {
      let e4 = z3[n4];
      Ae2(n4) <= t3 && t3 <= W2(n4) && V3(e4, t3, Ue2, "junction"), Ae2(n4) <= a3 && a3 <= W2(n4) && V3(e4, a3, Ue2, "junction");
    }
  }
  for (let e3 of M4) Ge2(e3, 0, e3.label), Ge2(e3, Se4, "");
  for (let e3 = 0; e3 < a2.actors.length; e3++) {
    let t3 = a2.actors[e3], n3 = j3.get(e3) ?? ve3, r2 = ie4.has(e3);
    ke3(z3[e3], n3, t3.label, t3.type, D3), r2 || ke3(z3[e3], Ce4, t3.label, t3.type, D3), o || (V3(z3[e3], n3 + D3 - 1, m3, "junction"), r2 || V3(z3[e3], Ce4, h3, "junction"));
  }
  for (let e3 = 0; e3 < a2.messages.length; e3++) {
    let t3 = a2.messages[e3], n3 = b3(t3.from), r2 = b3(t3.to), i2 = z3[n3], l2 = z3[r2], u3 = n3 === r2, d3 = t3.lineStyle === "dashed", f3 = t3.arrowHead === "filled", p4 = t3.isLost === true, m4 = o ? "x" : "\u2715", h4 = d3 ? o ? "." : "\u254C" : s;
    if (u3) {
      let n4 = fe3[e3], r3 = Da(t3), a3 = t3.seqNumber === void 0 ? void 0 : String(t3.seqNumber), s2 = Q(t3.label);
      V3(i2, n4, g3, "junction");
      let l3 = i2 + 1;
      if (a3 !== void 0) {
        for (let e4 = 0; e4 < a3.length; e4++) V3(i2 + 1 + e4, n4, a3[e4], "text");
        l3 = i2 + 1 + a3.length;
      }
      for (let e4 = l3; e4 < i2 + r3; e4++) V3(e4, n4, h4, "line");
      V3(i2 + r3, n4, o ? "+" : "\u2510", "corner");
      let u4 = i2 + r3 + 2;
      for (let e4 = 0; e4 < s2.length; e4++) {
        let t4 = n4 + 1 + e4;
        V3(i2 + r3, t4, c, "line"), Oe3(u4, t4, s2[e4], "text", Te3);
      }
      let d4 = n4 + 1 + s2.length;
      V3(i2, d4, p4 ? m4 : f3 ? o ? "<" : "\u25C0" : o ? "<" : "\u25C1", "arrow");
      for (let e4 = i2 + 1; e4 < i2 + r3; e4++) V3(e4, d4, h4, "line");
      V3(i2 + r3, d4, o ? "+" : "\u2518", "corner");
    } else {
      let n4 = pe4[e3], a3 = fe3[e3], s2 = i2 < l2, c2 = A3.get(e3) === r2, u4 = l2;
      if (c2) {
        let e4 = O3(r2, l2), t4 = e4 + w2[r2] - 1;
        u4 = s2 ? e4 - 1 : t4 + 1;
      }
      let d4 = Math.floor((i2 + l2) / 2), g4 = Q(t3.label);
      for (let e4 = 0; e4 < g4.length; e4++) {
        let t4 = g4[e4];
        Oe3(d4 - Math.floor(H2(t4) / 2), n4 + e4, t4, "text", Te3);
      }
      if (s2) {
        for (let e4 = i2 + 1; e4 < u4; e4++) V3(e4, a3, h4, "line");
        V3(u4, a3, p4 ? m4 : f3 ? o ? ">" : "\u25B6" : o ? ">" : "\u25B7", "arrow"), t3.bidirectional && V3(i2, a3, o ? "<" : "\u25C0", "arrow");
      } else {
        for (let e4 = u4 + 1; e4 < i2; e4++) V3(e4, a3, h4, "line");
        V3(u4, a3, p4 ? m4 : f3 ? o ? "<" : "\u25C0" : o ? "<" : "\u25C1", "arrow"), t3.bidirectional && V3(i2, a3, o ? ">" : "\u25B6", "arrow");
      }
      if (t3.seqNumber !== void 0) {
        let e4 = String(t3.seqNumber);
        if (s2) {
          let t4 = i2 + 1;
          if (t4 + e4.length < l2) for (let n5 = 0; n5 < e4.length; n5++) V3(t4 + n5, a3, e4[n5], "text");
        } else {
          let t4 = i2 - e4.length;
          if (t4 > u4) for (let n5 = 0; n5 < e4.length; n5++) V3(t4 + n5, a3, e4[n5], "text");
        }
      }
    }
  }
  for (let [e3, t3] of ie4) V3(z3[e3], t3, o ? "x" : "\u2715", "arrow");
  let Ke2 = Te3 - 1;
  for (let e3 = 0; e3 < a2.blocks.length; e3++) {
    let t3 = a2.blocks[e3], n3 = me3.get(e3), r2 = he4.get(e3);
    if (n3 === void 0 || r2 === void 0) continue;
    let i2 = Te3, o2 = 0;
    for (let e4 = t3.startIndex; e4 <= t3.endIndex && !(e4 >= a2.messages.length); e4++) {
      let t4 = a2.messages[e4], n4 = y3.get(t4.from) ?? 0, r3 = y3.get(t4.to) ?? 0;
      if (i2 = Math.min(i2, z3[Math.min(n4, r3)]), o2 = Math.max(o2, z3[Math.max(n4, r3)]), n4 === r3) {
        let e5 = z3[n4] + Da(t4) + 2 + Dn(t4.label);
        o2 = Math.max(o2, e5);
      }
    }
    let u3 = i2 - Ea, m4 = o2 + Ea, h4 = Infinity, v3 = -Infinity;
    for (let e4 of z3) e4 > o2 && e4 < h4 && (h4 = e4), e4 < i2 && e4 > v3 && (v3 = e4);
    m4 >= h4 && (m4 = Math.max(o2, h4 - Ea)), u3 <= v3 && (u3 = Math.min(i2, v3 + Ea)), u3 = Math.max(0, u3), m4 > Ke2 && (Ie2(Ee3, m4 + 1, we4 - 1), Ne2(De3, m4 + 1, we4 - 1), Ke2 = m4);
    let b4 = t3.label ? `${t3.type} [${t3.label}]` : t3.type, S4 = u3 + 1 + x3(t3);
    if (S4 > m4) {
      m4 = S4;
      let [e4] = Fe2(Ee3);
      m4 > e4 && (Ie2(Ee3, m4, we4 - 1), Ne2(De3, m4, we4 - 1)), Te3 = Math.max(Te3, m4 + 1), Ke2 = Math.max(Ke2, m4);
    }
    V3(u3, n3, l, "border");
    for (let e4 = u3 + 1; e4 < m4; e4++) V3(e4, n3, s, "border");
    V3(m4, n3, d2, "border");
    let C4 = Q(b4);
    for (let e4 = 0; e4 < C4.length && n3 + e4 < r2; e4++) Oe3(u3 + 1, n3 + e4, C4[e4], "text", m4);
    V3(u3, r2, f2, "border");
    for (let e4 = u3 + 1; e4 < m4; e4++) V3(e4, r2, s, "border");
    V3(m4, r2, p3, "border");
    for (let e4 = n3 + 1; e4 < r2; e4++) V3(u3, e4, c, "border"), V3(m4, e4, c, "border");
    for (let n4 = 0; n4 < t3.dividers.length; n4++) {
      let r3 = ge4.get(`${e3}:${n4}`);
      if (r3 === void 0) continue;
      let i3 = qe2();
      V3(u3, r3, g3, "junction");
      for (let e4 = u3 + 1; e4 < m4; e4++) V3(e4, r3, i3, "line");
      V3(m4, r3, _3, "junction");
      let a3 = t3.dividers[n4].label;
      if (a3) {
        let e4 = `[${a3}]`;
        Oe3(u3 + 1, r3, e4, "text", m4);
      }
    }
  }
  for (let e3 of _e3) {
    Ie2(Ee3, e3.x + e3.width, e3.y + e3.height), Ne2(De3, e3.x + e3.width, e3.y + e3.height), V3(e3.x, e3.y, l, "border");
    for (let t4 = 1; t4 < e3.width - 1; t4++) V3(e3.x + t4, e3.y, s, "border");
    V3(e3.x + e3.width - 1, e3.y, d2, "border");
    for (let t4 = 0; t4 < e3.lines.length; t4++) {
      let n3 = e3.y + 1 + t4;
      V3(e3.x, n3, c, "border"), V3(e3.x + e3.width - 1, n3, c, "border");
      for (let t5 = e3.x + 1; t5 < e3.x + e3.width - 1; t5++) V3(t5, n3, " ", "text");
      Oe3(e3.x + 1 + S3, n3, e3.lines[t4], "text");
    }
    let t3 = e3.y + e3.height - 1;
    V3(e3.x, t3, f2, "border");
    for (let n3 = 1; n3 < e3.width - 1; n3++) V3(e3.x + n3, t3, s, "border");
    V3(e3.x + e3.width - 1, t3, p3, "border");
  }
  return We(Ee3, {
    roleCanvas: De3,
    colorMode: n2,
    theme: r
  });
  function qe2() {
    return o ? "-" : "\u254C";
  }
}
function ka(e2, t2) {
  return e2.rowStart <= t2.rowEnd && t2.rowStart <= e2.rowEnd;
}
function Aa(e2, t2) {
  let n2 = e2.map((e3) => ({
    item: e3,
    geom: t2(e3)
  })).sort((e3, t3) => e3.geom.idealMid - t3.geom.idealMid), r = (e3, t3) => {
    let r2 = n2[e3];
    if (r2) for (let i2 = e3 + t3; i2 >= 0 && i2 < n2.length; i2 += t3) {
      let e4 = n2[i2];
      if (e4 && ka(e4.geom, r2.geom)) return e4.geom;
    }
  }, i = /* @__PURE__ */ new Map();
  for (let [e3, t3] of n2.entries()) {
    let n3 = t3.geom, a2 = r(e3, -1), o = r(e3, 1), s = a2 && a2.end >= n3.start ? Math.floor((a2.idealMid + n3.idealMid) / 2) + 1 : -Infinity, c = o && n3.end >= o.start ? Math.floor((n3.idealMid + o.idealMid) / 2) : Infinity;
    i.set(t3.item, {
      left: s,
      right: c
    });
  }
  return i;
}
function ja(e2) {
  let t2 = [];
  e2.annotation && t2.push(`<<${e2.annotation}>>`);
  let n2 = Q(e2.label);
  t2.push(...n2);
  let r = e2.attributes.map(M2), i = e2.methods.map(M2), a2 = [t2];
  return r.length > 0 && a2.push(r), i.length > 0 && a2.push(i), a2;
}
function Ma(e2, t2) {
  return {
    type: e2,
    markerAt: t2,
    dashed: e2 === "dependency" || e2 === "realization"
  };
}
function Na(e2, t2, n2) {
  switch (e2) {
    case "inheritance":
    case "realization":
      return n2 === "down" ? t2 ? "^" : "\u25B3" : n2 === "up" ? t2 ? "v" : "\u25BD" : n2 === "left" ? t2 ? ">" : "\u25C1" : t2 ? "<" : "\u25B7";
    case "composition":
      return t2 ? "*" : "\u25C6";
    case "aggregation":
      return t2 ? "o" : "\u25C7";
    case "association":
    case "dependency":
      return n2 === "down" ? t2 ? "v" : "\u25BC" : n2 === "up" ? t2 ? "^" : "\u25B2" : n2 === "left" ? t2 ? "<" : "\u25C0" : t2 ? ">" : "\u25B6";
  }
}
function Pa(e2, t2, n2, r, i) {
  let a2 = e2 + t2.length - 1, o = r > e2, s = i < a2;
  if (!o && !s) return {
    start: e2,
    cells: t2
  };
  let c = o ? r : e2, l = Math.max(0, (s ? i : a2) - c + 1), u3 = +!!o + +!!s;
  if (l === 0) return {
    start: c,
    cells: []
  };
  if (l < u3) return {
    start: c,
    cells: ["\u2026"]
  };
  let d2 = Math.max(0, l - u3), f2 = je2(n2), p3 = f2.length <= d2 ? f2 : o && !s ? f2.slice(f2.length - d2) : f2.slice(0, d2), m3 = [
    ...o ? ["\u2026"] : [],
    ...p3,
    ...s ? ["\u2026"] : []
  ];
  return {
    start: c + Math.max(0, Math.floor((l - m3.length) / 2)),
    cells: m3
  };
}
function Fa(e2) {
  return Math.max(...Q(e2).map((e3) => H2(e3))) + 2;
}
var Ia = 2;
var La = 2;
var Ra = 2;
var za = 4;
var Ba = 3;
function Va(e2, t2) {
  let n2 = new Set(e2.classes.map((e3) => e3.id)), r = /* @__PURE__ */ new Set(), i = [];
  for (let a2 of e2.namespaces) {
    let e3 = [];
    for (let i2 of a2.classIds) if (!(!n2.has(i2) || r.has(i2))) {
      r.add(i2), e3.push(i2);
      for (let [n3, r2] of t2) r2.forClass === i2 && e3.push(n3);
    }
    e3.length > 0 && i.push({
      name: a2.name,
      ids: e3
    });
  }
  return i;
}
function Ha(e2, t2) {
  let n2 = [], r = /* @__PURE__ */ new Set();
  for (let i of e2) {
    let a2 = t2.get(i);
    a2 === void 0 ? n2.push(i) : r.has(a2) || (r.add(a2), n2.push(...e2.filter((e3) => t2.get(e3) === a2)));
  }
  return n2;
}
function Ua(e2, t2, n2, r, i = {}) {
  let a2 = _(e2), { diagram: o, notesById: s } = Wa(_e(a2));
  if (o.classes.length === 0) return "";
  let c = Va(o, s), d2 = /* @__PURE__ */ new Map();
  for (let [e3, t3] of c.entries()) for (let n3 of t3.ids) d2.set(n3, e3);
  let f2 = t2.useAscii, p3 = It(t2.paddingX, 5, 4, 1) + (c.length > 0 ? za : 0), m3 = It(t2.paddingY, 5, 3, 1) + (c.length > 0 ? Ba : 0), h3 = /* @__PURE__ */ new Map(), g3 = /* @__PURE__ */ new Map(), _3 = /* @__PURE__ */ new Map();
  for (let e3 of o.classes) {
    let n3 = ja(e3);
    h3.set(e3.id, n3);
    let { width: r2, height: i2 } = ca(n3, t2.boxBorderPadding);
    g3.set(e3.id, r2), _3.set(e3.id, i2);
  }
  let v2 = /* @__PURE__ */ new Map();
  for (let e3 of o.classes) v2.set(e3.id, e3);
  let y3 = /* @__PURE__ */ new Map(), b3 = /* @__PURE__ */ new Map();
  for (let e3 of o.relationships) {
    let t3 = e3.from, n3 = e3.to, r2 = y3.get(n3) ?? /* @__PURE__ */ new Set();
    y3.set(n3, r2), r2.add(t3);
    let i2 = b3.get(t3) ?? /* @__PURE__ */ new Set();
    b3.set(t3, i2), i2.add(n3);
  }
  let x3 = /* @__PURE__ */ new Map(), S3 = o.classes.filter((e3) => !y3.has(e3.id) || y3.get(e3.id).size === 0).map((e3) => e3.id);
  for (let e3 of S3) x3.set(e3, 0);
  let C3 = o.classes.length - 1, ee3 = 0;
  for (; ee3 < S3.length; ) {
    let e3 = S3[ee3++], t3 = b3.get(e3);
    if (t3) for (let n3 of t3) {
      let t4 = (x3.get(e3) ?? 0) + 1;
      t4 > C3 || (!x3.has(n3) || x3.get(n3) < t4) && (x3.set(n3, t4), S3.push(n3));
    }
  }
  for (let e3 of o.classes) x3.has(e3.id) || x3.set(e3.id, 0);
  Ga(s, x3);
  let w2 = Math.max(...x3.values(), 0), T3 = Array.from({ length: w2 + 1 }, () => []);
  for (let e3 of o.classes) T3[x3.get(e3.id)].push(e3.id);
  if (c.length > 0) for (let [e3, t3] of T3.entries()) T3[e3] = Ha(t3, d2);
  let E2 = /* @__PURE__ */ new Map(), D3 = /* @__PURE__ */ new Map();
  {
    let e3 = /* @__PURE__ */ new Map();
    o.relationships.forEach((t3, n3) => {
      let r2 = [t3.from, t3.to].sort().join("::"), i2 = e3.get(r2) ?? [];
      i2.push(n3), e3.set(r2, i2);
    });
    for (let t3 of e3.values()) {
      if (t3.length < 2) continue;
      let e4 = t3.length, n3 = Math.max(...t3.map((e5) => {
        let t4 = o.relationships[e5].label;
        return t4 ? Fa(t4) : 3;
      })) + 1;
      t3.forEach((t4, r2) => {
        E2.set(t4, Math.round((r2 - (e4 - 1) / 2) * n3)), D3.set(t4, (e4 - 1) * n3);
      });
    }
  }
  let k3 = /* @__PURE__ */ new Map(), te3 = /* @__PURE__ */ new Map(), ne3 = /* @__PURE__ */ new Map(), A3 = /* @__PURE__ */ new Map();
  {
    let e3 = (e4, t3, n3) => {
      let r2 = /* @__PURE__ */ new Map();
      o.relationships.forEach((t4, n4) => {
        if (E2.has(n4) || !v2.has(t4.from) || !v2.has(t4.to)) return;
        let i2 = x3.get(t4.from) ?? 0;
        if ((x3.get(t4.to) ?? 0) - i2 !== 1) return;
        let a3 = e4(t4), o2 = r2.get(a3) ?? [];
        o2.push(n4), r2.set(a3, o2);
      });
      for (let e5 of r2.values()) {
        if (e5.length < 2) continue;
        let r3 = e5.length, i2 = Math.max(...e5.map((e6) => {
          let t4 = o.relationships[e6].label;
          return t4 ? Fa(t4) : 3;
        })) + 1;
        e5.forEach((e6, a3) => {
          t3.set(e6, Math.round((a3 - (r3 - 1) / 2) * i2)), n3.set(e6, (r3 - 1) * i2);
        });
      }
    };
    e3((e4) => e4.to, ne3, A3), e3((e4) => e4.from, k3, te3);
  }
  let re3 = /* @__PURE__ */ new Map();
  for (let e3 of o.classes) re3.set(e3.id, {
    left: 0,
    right: 0
  });
  o.relationships.forEach((e3, t3) => {
    if (!v2.has(e3.from) || !v2.has(e3.to)) return;
    let n3 = e3.label ? Fa(e3.label) : 1, r2 = E2.get(t3) ?? k3.get(t3) ?? 0, i2 = E2.get(t3) ?? ne3.get(t3) ?? 0, a3 = re3.get(e3.from);
    a3.left = Math.max(a3.left, Math.floor(n3 / 2) - r2), a3.right = Math.max(a3.right, r2 + n3 - 1 - Math.floor(n3 / 2));
    let o2 = re3.get(e3.to);
    o2.left = Math.max(o2.left, Math.floor(n3 / 2) - i2), o2.right = Math.max(o2.right, i2 + n3 - 1 - Math.floor(n3 / 2));
  });
  let j3 = /* @__PURE__ */ new Map(), ie4 = 0, M4 = 0;
  for (let e3 = 0; e3 <= w2; e3++) {
    let t3 = T3[e3];
    if (t3.length === 0) continue;
    let n3 = (e4) => {
      let t4 = y3.get(e4);
      return t4 && t4.size > 0 ? [...t4].sort().join(",") : `root:${e4}`;
    }, r2 = /* @__PURE__ */ new Map();
    for (let e4 of t3) {
      let t4 = n3(e4), i3 = r2.get(t4);
      i3 || (i3 = [], r2.set(t4, i3)), i3.push(e4);
    }
    let i2 = /* @__PURE__ */ new Map(), a3 = /* @__PURE__ */ new Map(), o2 = /* @__PURE__ */ new Map();
    {
      let e4 = 0;
      for (let n4 of t3) {
        let t4 = g3.get(n4), r3 = re3.get(n4), s3 = Math.max(0, r3.left - Math.floor(t4 / 2)), c3 = Math.max(0, r3.right - (t4 - 1 - Math.floor(t4 / 2)));
        i2.set(n4, e4), a3.set(n4, s3 + t4 + c3), o2.set(n4, s3), e4 += s3 + t4 + c3 + p3;
      }
    }
    let s2 = 0, c2 = 0, l = (e4, t4) => {
      let n4 = v2.get(e4), r3 = g3.get(e4), i3 = _3.get(e4), l2 = o2.get(e4), u4 = a3.get(e4);
      j3.set(e4, {
        cls: n4,
        sections: h3.get(e4),
        x: t4 + l2,
        y: ie4,
        width: r3,
        height: i3
      }), M4 = Math.max(M4, t4 + u4), s2 = t4 + u4 + p3, c2 = Math.max(c2, i3);
    }, u3 = /* @__PURE__ */ new Set();
    for (let c3 of t3) {
      if (u3.has(c3)) continue;
      let t4 = n3(c3), d3 = y3.get(c3), f3 = d3 ? [...d3].filter((t5) => x3.get(t5) < e3) : [];
      if (f3.length === 0) {
        l(c3, Math.max(i2.get(c3), s2, 0)), u3.add(c3);
        continue;
      }
      let m4 = r2.get(t4), h4 = f3.map((e4) => {
        let t5 = j3.get(e4);
        return t5.x + Math.floor(t5.width / 2);
      }), _4 = Math.round(h4.reduce((e4, t5) => e4 + t5, 0) / h4.length), v3 = 0;
      for (let e4 = 0; e4 < m4.length; e4++) v3 += a3.get(m4[e4]), e4 < m4.length - 1 && (v3 += p3);
      let b4 = o2.get(m4[0]), S4 = m4[m4.length - 1], C4 = a3.get(S4) - o2.get(S4) - g3.get(S4), ee4 = v3 - b4 - C4, w3 = _4 - b4 - Math.floor(ee4 / 2), T4 = Math.max(w3, s2, 0);
      for (let e4 of m4) l(e4, T4), u3.add(e4), T4 = s2;
    }
    ie4 += c2 + m3;
  }
  let ae3 = [];
  if (c.length > 0) {
    for (let e3 of j3.values()) e3.x += Ia, e3.y += La;
    M4 += Ia;
    for (let e3 of c) {
      let t3 = Infinity, n3 = Infinity, r2 = -Infinity, i2 = -Infinity;
      for (let a4 of e3.ids) {
        let e4 = j3.get(a4);
        e4 && (t3 = Math.min(t3, e4.x), n3 = Math.min(n3, e4.y), r2 = Math.max(r2, e4.x + e4.width - 1), i2 = Math.max(i2, e4.y + e4.height - 1));
      }
      if (t3 === Infinity) continue;
      let a3 = t3 - Ia, o2 = Math.max(r2 + Ia, a3 + H2(e3.name) + 5);
      ae3.push({
        name: e3.name,
        x0: a3,
        y0: n3 - La,
        x1: o2,
        y1: i2 + Ra
      });
    }
  }
  let N3 = M4;
  for (let e3 of ae3) N3 = Math.max(N3, e3.x1 + 1);
  let P3 = 0;
  for (let e3 of j3.values()) N3 = Math.max(N3, e3.x + e3.width), P3 = Math.max(P3, e3.y + e3.height);
  for (let e3 of ae3) P3 = Math.max(P3, e3.y1 + 1);
  N3 += 4, P3 += 2;
  let F3 = U2(N3 - 1, P3 - 1), I3 = Me2(N3 - 1, P3 - 1);
  function L3(e3, t3, n3, r2) {
    G(F3, e3, t3, n3, {
      role: r2,
      roleCanvas: I3
    });
  }
  let ce3 = i.hyperlinks ? oe2(N3 - 1, P3 - 1) : void 0;
  for (let e3 of j3.values()) {
    let n3 = la(e3.sections, f2, t2.boxBorderPadding);
    for (let t3 = 0; t3 < n3.length; t3++) for (let r2 = 0; r2 < n3[0].length; r2++) {
      let i2 = n3[t3][r2];
      if (i2 !== " ") {
        let n4 = e3.x + t3, a3 = e3.y + r2;
        n4 < N3 && a3 < P3 && L3(n4, a3, i2, sa(i2));
      }
    }
    if (ce3) {
      let t3 = t(o.interactions.get(e3.cls.id)?.href), r2 = e3.sections[0];
      if (t3 !== void 0 && r2 !== void 0) {
        let i2 = 1 + +!!e3.cls.annotation;
        se2(ce3, n3, {
          x: e3.x,
          y: e3.y
        }, t3, {
          from: i2,
          to: r2.length
        });
      }
    }
  }
  let le3 = /* @__PURE__ */ new Set();
  for (let e3 of j3.values()) for (let t3 = 0; t3 < e3.height; t3++) for (let n3 = 0; n3 < e3.width; n3++) le3.add(`${e3.x + n3},${e3.y + t3}`);
  function R3(e3, t3, n3, r2) {
    le3.has(`${e3},${t3}`) || L3(e3, t3, n3, r2);
  }
  function z3(e3, t3, n3) {
    for (let [r2, i2] of j3.entries()) if (!n3?.has(r2) && e3 >= i2.x && e3 <= i2.x + i2.width - 1 && t3 >= i2.y && t3 <= i2.y + i2.height - 1) return true;
    return false;
  }
  function ue2(e3, t3, n3, r2) {
    return ga(e3, 0, e3 + N3 + 9, (e4) => {
      for (let i2 = Math.min(t3, n3); i2 <= Math.max(t3, n3); i2++) if (z3(e4, i2, r2)) return false;
      return true;
    }) ?? N3 + 2;
  }
  let de3 = f2 ? "-" : "\u2500", fe3 = f2 ? "|" : "\u2502", pe4 = f2 ? "." : "\u254C", me3 = f2 ? ":" : "\u250A";
  function he4(e3, t3, n3) {
    let r2 = Math.floor(n3 / 2), i2 = n3 - 1 - r2, a3 = t3 > r2 + i2 ? (r2 + i2) / t3 : 1;
    return Math.max(-r2, Math.min(i2, Math.round(e3 * a3)));
  }
  function ge4(e3, t3, n3) {
    let r2 = E2.get(e3) ?? k3.get(e3) ?? 0, i2 = E2.get(e3) ?? ne3.get(e3) ?? 0, a3 = D3.get(e3) ?? te3.get(e3) ?? 0, o2 = D3.get(e3) ?? A3.get(e3) ?? 0, s2 = t3.x + Math.floor(t3.width / 2), c2 = n3.x + Math.floor(n3.width / 2);
    return {
      fromCX: s2 + r2,
      toCX: c2 + i2,
      fromAnchorX: s2 + he4(r2, a3, t3.width),
      toAnchorX: c2 + he4(i2, o2, n3.width)
    };
  }
  function _e3(e3, t3, n3, r2) {
    if (le3.has(`${e3},${t3}`) || I3[e3]?.[t3] === "arrow") return;
    let i2 = F3[e3]?.[t3];
    if (!f2 && i2 !== void 0 && Re2(i2) && Re2(n3)) {
      let a3 = Ve2(i2, n3);
      L3(e3, t3, a3, a3 === n3 ? r2 : "junction");
      return;
    }
    L3(e3, t3, n3, r2);
  }
  function ve3(e3, t3, n3, r2, i2) {
    if (t3 === n3) return;
    let a3 = Math.min(t3, n3), o2 = Math.max(t3, n3);
    for (let t4 = a3 + 1; t4 < o2; t4++) _e3(t4, e3, r2, "line");
    if (f2) {
      _e3(t3, e3, r2, "line"), _e3(n3, e3, r2, "line");
      return;
    }
    let s2 = n3 > t3, c2 = i2 ? s2 ? "\u2514" : "\u2518" : s2 ? "\u250C" : "\u2510", l = i2 ? s2 ? "\u2510" : "\u250C" : s2 ? "\u2518" : "\u2514";
    _e3(t3, e3, c2, "corner"), _e3(n3, e3, l, "corner");
  }
  let ye3 = /* @__PURE__ */ new Map(), B3 = /* @__PURE__ */ new Map();
  o.relationships.forEach((e3, t3) => {
    let n3 = j3.get(e3.from), r2 = j3.get(e3.to);
    if (!n3 || !r2) return;
    let i2 = Ma(e3.type, e3.markerAt), a3 = i2.dashed ? pe4 : de3, o2 = i2.dashed ? me3 : fe3, s2 = /* @__PURE__ */ new Set([e3.from, e3.to]), { fromCX: c2, toCX: l, fromAnchorX: u3, toAnchorX: d3 } = ge4(t3, n3, r2), p4 = n3.y + n3.height - 1, m4 = r2.y;
    if (p4 < m4) {
      let e4 = ue2(c2, p4 + 1, m4 - 1, s2), n4 = e4 !== c2;
      if (e4 >= N3 && Ie2(F3, e4 + 2, P3), n4) {
        let n5 = p4 + 1, r3 = m4 - 1;
        ye3.set(t3, {
          routeX: e4,
          exitY: n5,
          entryY: r3,
          fromAnchorX: u3,
          toAnchorX: d3,
          clearSide: e4 > c2 ? "right" : "left"
        });
        let s3 = Math.min(u3, e4), l2 = Math.max(u3, e4);
        for (let e5 = s3; e5 <= l2; e5++) R3(e5, n5, a3, "line");
        !f2 && n5 < (F3[0]?.length ?? 0) && (u3 < e4 ? (R3(u3, n5, "\u2514", "corner"), R3(e4, n5, "\u2510", "corner")) : (R3(u3, n5, "\u2518", "corner"), R3(e4, n5, "\u250C", "corner")));
        for (let t4 = n5 + 1; t4 <= r3; t4++) R3(e4, t4, o2, "line");
        if (e4 !== d3) {
          let t4 = Math.min(e4, d3), n6 = Math.max(e4, d3);
          for (let e5 = t4; e5 <= n6; e5++) R3(e5, r3, a3, "line");
          !f2 && r3 < (F3[0]?.length ?? 0) && (e4 < d3 ? (R3(e4, r3, "\u2514", "corner"), R3(d3, r3, "\u2510", "corner")) : (R3(e4, r3, "\u2518", "corner"), R3(d3, r3, "\u250C", "corner")));
        }
        if (i2.markerAt === "to") {
          let e5 = i2.type === "inheritance" || i2.type === "realization";
          R3(d3, r3, Na(i2.type, f2, e5 ? "up" : "down"), "arrow");
        }
        if (i2.markerAt === "from") {
          let e5 = Na(i2.type, f2, "down");
          R3(u3, p4 + 1, e5, "arrow");
        }
      } else {
        let e5 = p4 + Math.floor((m4 - p4) / 2), t4 = c2 !== u3, n5 = l !== d3;
        ve3(p4 + 1, u3, c2, a3, true);
        for (let n6 = p4 + (t4 ? 2 : 1); n6 <= e5; n6++) R3(c2, n6, o2, "line");
        if (c2 !== l && e5 < (F3[0]?.length ?? 0)) {
          let t5 = Math.min(c2, l), n6 = Math.max(c2, l);
          for (let r3 = t5; r3 <= n6; r3++) R3(r3, e5, a3, "line");
          f2 || (R3(c2, e5, c2 < l ? "\u2514" : "\u2518", "corner"), R3(l, e5, c2 < l ? "\u2510" : "\u250C", "corner"));
        }
        for (let t5 = e5 + 1; t5 < m4 - +!!n5; t5++) R3(l, t5, o2, "line");
        if (ve3(m4 - 1, d3, l, a3, false), i2.markerAt === "to") {
          let e6 = i2.type === "inheritance" || i2.type === "realization";
          R3(d3, m4 - 1, Na(i2.type, f2, e6 ? "up" : "down"), "arrow");
        }
        i2.markerAt === "from" && R3(u3, p4 + 1, Na(i2.type, f2, "down"), "arrow");
      }
    } else if (r2.y + r2.height - 1 < n3.y) {
      let e4 = n3.y, t4 = r2.y + r2.height - 1, s3 = t4 + Math.floor((e4 - t4) / 2), p5 = c2 !== u3, m5 = l !== d3;
      ve3(e4 - 1, u3, c2, a3, false);
      for (let t5 = e4 - (p5 ? 2 : 1); t5 >= s3; t5--) R3(c2, t5, o2, "line");
      if (c2 !== l) {
        let e5 = Math.min(c2, l), t5 = Math.max(c2, l);
        for (let n4 = e5; n4 <= t5; n4++) R3(n4, s3, a3, "line");
        !f2 && s3 >= 0 && s3 < P3 && (R3(c2, s3, c2 < l ? "\u250C" : "\u2510", "corner"), R3(l, s3, c2 < l ? "\u2518" : "\u2514", "corner"));
      }
      for (let e5 = s3 - 1; e5 > t4 + +!!m5; e5--) R3(l, e5, o2, "line");
      if (ve3(t4 + 1, d3, l, a3, true), i2.markerAt === "from") {
        let t5 = Na(i2.type, f2, "up"), n4 = e4 - 1;
        for (let e5 = 0; e5 < t5.length; e5++) R3(u3 - Math.floor(t5.length / 2) + e5, n4, t5[e5], "arrow");
      }
      if (i2.markerAt === "to") {
        let e5 = i2.type === "inheritance" || i2.type === "realization" ? "down" : "up", n4 = Na(i2.type, f2, e5), r3 = t4 + 1;
        for (let e6 = 0; e6 < n4.length; e6++) R3(d3 - Math.floor(n4.length / 2) + e6, r3, n4[e6], "arrow");
      }
    } else {
      let s3 = r2.y + r2.height - 1, m5 = Math.min(c2, l), h4 = Math.max(c2, l), g4 = Math.max(p4, s3);
      for (let [t4, r3] of j3.entries()) t4 !== e3.from && t4 !== e3.to && r3.y === n3.y && r3.x < h4 + 1 && r3.x + r3.width > m5 && (g4 = Math.max(g4, r3.y + r3.height - 1));
      let _4 = g4 + 2;
      B3.set(t3, _4), Ie2(F3, N3, _4 + 1), Ne2(I3, N3, _4 + 1);
      let v3 = c2 !== u3, y4 = l !== d3;
      ve3(p4 + 1, u3, c2, a3, true);
      for (let e4 = p4 + (v3 ? 2 : 1); e4 <= _4; e4++) R3(c2, e4, o2, "line");
      for (let e4 = m5; e4 <= h4; e4++) R3(e4, _4, a3, "line");
      for (let e4 = _4 - 1; e4 >= s3 + (y4 ? 2 : 1); e4--) R3(l, e4, o2, "line");
      if (ve3(s3 + 1, d3, l, a3, true), i2.markerAt === "from") {
        let e4 = Na(i2.type, f2, "down"), t4 = p4 + 1;
        for (let n4 = 0; n4 < e4.length; n4++) R3(u3 - Math.floor(e4.length / 2) + n4, t4, e4[n4], "arrow");
      }
      if (i2.markerAt === "to") {
        let e4 = i2.type === "inheritance" || i2.type === "realization", t4 = Na(i2.type, f2, e4 ? "down" : "up"), n4 = r2.y + r2.height;
        for (let e5 = 0; e5 < t4.length; e5++) R3(d3 - Math.floor(t4.length / 2) + e5, n4, t4[e5], "arrow");
      }
    }
  });
  function be4(e3, t3, n3, r2) {
    let { fromCX: i2, toCX: a3 } = ge4(e3, t3, n3), o2 = t3.y + t3.height - 1, s2 = n3.y;
    if (o2 < s2) {
      let t4 = ye3.get(e3);
      if (t4) {
        let e4 = t4.exitY + 1, n4 = t4.entryY;
        if (n4 >= e4) return {
          idealMidX: t4.clearSide === "right" ? t4.routeX + 1 + Math.floor(r2 / 2) : t4.routeX - 1 - Math.ceil(r2 / 2),
          baseMidY: Math.floor((e4 + n4) / 2)
        };
        let i3 = Math.abs(t4.routeX - t4.fromAnchorX);
        return Math.abs(t4.toAnchorX - t4.routeX) >= i3 ? {
          idealMidX: Math.floor((t4.routeX + t4.toAnchorX) / 2),
          baseMidY: t4.entryY
        } : {
          idealMidX: Math.floor((t4.fromAnchorX + t4.routeX) / 2),
          baseMidY: t4.exitY
        };
      }
      return {
        idealMidX: Math.floor((i2 + a3) / 2),
        baseMidY: Math.floor((o2 + 1 + s2 - 1) / 2)
      };
    }
    if (n3.y + n3.height - 1 < t3.y) {
      let e4 = n3.y + n3.height - 1;
      return {
        idealMidX: Math.floor((i2 + a3) / 2),
        baseMidY: Math.floor((e4 + 1 + t3.y - 1) / 2)
      };
    }
    return {
      idealMidX: Math.floor((i2 + a3) / 2),
      /* v8 ignore next */
      baseMidY: B3.get(e3) ?? Math.max(o2, n3.y + n3.height - 1) + 2
    };
  }
  function xe4(e3, t3, n3, r2, i2, a3, o2) {
    let s2 = r2, c2 = Math.floor(a3 / 2), l = e3.y + e3.height - 1, u3 = t3.y, d3 = false;
    for (let e4 = 0; e4 < a3; e4++) {
      let t4 = s2 - c2 + e4, r3 = n3 - Math.floor(i2 / 2), a4 = Math.max(0, r3);
      for (let e5 = a4; e5 < a4 + i2; e5++) if (z3(e5, t4, o2)) {
        d3 = true;
        break;
      }
      if (d3) break;
    }
    if (d3) {
      let e4 = l + 1, t4 = u3 - 1;
      for (let r3 = e4; r3 <= t4; r3++) {
        let e5 = true, t5 = n3 - Math.floor(i2 / 2), a4 = Math.max(0, t5);
        for (let t6 = a4; t6 < a4 + i2; t6++) if (z3(t6, r3, o2)) {
          e5 = false;
          break;
        }
        if (e5) {
          s2 = r3;
          break;
        }
      }
    }
    return s2;
  }
  let Se4 = /* @__PURE__ */ new Map(), Ce4 = [];
  for (let [e3, t3] of o.relationships.entries()) {
    if (!t3.label) continue;
    let n3 = j3.get(t3.from), r2 = j3.get(t3.to);
    if (!n3 || !r2) continue;
    let i2 = Q(t3.label), a3 = Math.floor(i2.length / 2), o2 = Math.max(...i2.map(H2)) + 2, { idealMidX: s2, baseMidY: c2 } = be4(e3, n3, r2, o2), l = /* @__PURE__ */ new Set([t3.from, t3.to]), u3 = xe4(n3, r2, s2, c2, o2, i2.length, l);
    Se4.set(t3, u3);
    let d3 = Math.max(0, s2 - Math.floor(o2 / 2));
    Ce4.push({
      rel: t3,
      idealMidX: s2,
      naturalStart: d3,
      naturalEnd: d3 + o2 - 1,
      rowStart: u3 - a3,
      rowEnd: u3 + a3
    });
  }
  let we4 = Aa(Ce4, (e3) => ({
    idealMid: e3.idealMidX,
    start: e3.naturalStart,
    end: e3.naturalEnd,
    rowStart: e3.rowStart,
    rowEnd: e3.rowEnd
  })), Te3 = /* @__PURE__ */ new Map();
  for (let e3 of Ce4) {
    let t3 = we4.get(e3);
    t3 && Te3.set(e3.rel, t3);
  }
  for (let [e3, t3] of o.relationships.entries()) {
    let n3 = j3.get(t3.from), r2 = j3.get(t3.to);
    if (!(!n3 || !r2) && t3.label) {
      let i2 = Q(t3.label), { idealMidX: a3 } = be4(e3, n3, r2, Math.max(...i2.map((e4) => H2(e4))) + 2), o2 = Se4.get(t3) - Math.floor(i2.length / 2), s2 = Te3.get(t3);
      for (let e4 = 0; e4 < i2.length; e4++) {
        let t4 = o2 + e4, n4 = i2[e4], r3 = je2(` ${n4} `), { start: c2, cells: l } = Pa(Math.max(0, a3 - Math.floor(r3.length / 2)), r3, n4, Math.max(0, s2.left), s2.right), u3 = c2 + l.length;
        u3 > 0 && t4 >= 0 && (Ie2(F3, Math.max(u3, 1), Math.max(t4 + 1, 1)), Ne2(I3, Math.max(u3, 1), Math.max(t4 + 1, 1)));
        for (let e5 = 0; e5 < l.length; e5++) {
          let n5 = c2 + e5;
          n5 >= 0 && t4 >= 0 && L3(n5, t4, l[e5], "text");
        }
      }
    }
  }
  for (let e3 of ae3) {
    let t3 = f2 ? "-" : "\u2500", n3 = f2 ? "|" : "\u2502", r2 = f2 ? {
      tl: "+",
      tr: "+",
      bl: "+",
      br: "+"
    } : {
      tl: "\u250C",
      tr: "\u2510",
      bl: "\u2514",
      br: "\u2518"
    }, i2 = je2(` ${e3.name} `), a3 = (t4) => (F3[t4]?.[e3.y0] ?? " ") === " ", o2 = e3.x0 + 2;
    for (; Array.from({ length: i2.length + 2 }, (e4, t4) => o2 - 1 + t4).some((e4) => !a3(e4)); ) o2++;
    e3.x1 = Math.max(e3.x1, o2 + i2.length + 1), Ie2(F3, e3.x1 + 1, e3.y1 + 1), Ne2(I3, e3.x1 + 1, e3.y1 + 1);
    let s2 = (e4, t4, n4, r3) => {
      F3[e4]?.[t4] === " " && L3(e4, t4, n4, r3);
    };
    for (let n4 = e3.x0 + 1; n4 < e3.x1; n4++) s2(n4, e3.y0, t3, "border"), s2(n4, e3.y1, t3, "border");
    for (let t4 = e3.y0 + 1; t4 < e3.y1; t4++) s2(e3.x0, t4, n3, "border"), s2(e3.x1, t4, n3, "border");
    s2(e3.x0, e3.y0, r2.tl, "border"), s2(e3.x1, e3.y0, r2.tr, "border"), s2(e3.x0, e3.y1, r2.bl, "border"), s2(e3.x1, e3.y1, r2.br, "border");
    for (let [n4, r3] of i2.entries()) F3[o2 + n4]?.[e3.y0] === t3 && L3(o2 + n4, e3.y0, r3, "text");
  }
  return Ka(s, j3, F3, f2, L3), We(F3, {
    roleCanvas: I3,
    colorMode: n2,
    theme: r,
    linkCanvas: ce3
  });
}
function Wa(e2) {
  let t2 = /* @__PURE__ */ new Map();
  if (e2.notes.length === 0) return {
    diagram: e2,
    notesById: t2
  };
  let n2 = (e3, n3) => {
    let r2 = `note ${e3}`;
    return t2.set(r2, n3), {
      id: r2,
      label: n3.text,
      attributes: [],
      methods: []
    };
  }, r = new Set(e2.classes.map((e3) => e3.id)), i = [];
  for (let t3 of e2.classes) {
    i.push(t3);
    for (let [r2, a2] of e2.notes.entries()) a2.forClass === t3.id && i.push(n2(r2, a2));
  }
  for (let [t3, a2] of e2.notes.entries()) (a2.forClass === void 0 || !r.has(a2.forClass)) && i.push(n2(t3, a2));
  return {
    diagram: {
      ...e2,
      classes: i
    },
    notesById: t2
  };
}
function Ga(e2, t2) {
  for (let [n2, r] of e2) {
    if (r.forClass === void 0) continue;
    let e3 = t2.get(r.forClass);
    e3 !== void 0 && t2.set(n2, e3);
  }
}
function Ka(e2, t2, n2, r, i) {
  if (e2.size === 0) return;
  let a2 = nr("rounded", r), o = r ? "." : "\u254C";
  for (let [r2, s] of e2) {
    let e3 = t2.get(r2);
    if (!e3) continue;
    let c = e3.x + e3.width - 1, l = e3.y + e3.height - 1;
    if (i(e3.x, e3.y, a2.tl, "border"), i(c, e3.y, a2.tr, "border"), i(e3.x, l, a2.bl, "border"), i(c, l, a2.br, "border"), s.forClass === void 0) continue;
    let u3 = t2.get(s.forClass);
    if (!u3 || u3.x + u3.width > e3.x || u3.y !== e3.y) continue;
    let d2 = u3.y + 1;
    for (let t3 = u3.x + u3.width; t3 < e3.x; t3++) n2[t3]?.[d2] === " " && i(t3, d2, o, "line");
  }
}
function qa(e2) {
  let t2 = e2.trim();
  return t2.length >= 2 && (t2[0] === '"' && t2[t2.length - 1] === '"' || t2[0] === "'" && t2[t2.length - 1] === "'") ? t2.slice(1, -1) : t2;
}
var Ja = '"graph <dir>"/"flowchart <dir>" (dir: TD, TB, LR, BT, RL), "stateDiagram-v2", "sequenceDiagram", "classDiagram", "erDiagram", "xychart-beta", "C4Context"/"C4Container"/"C4Component"/"C4Dynamic"/"C4Deployment", "architecture-beta"';
function Ya(e2) {
  let t2 = e2.trim().toLowerCase();
  if (/^sequence/.test(t2)) return "sequenceDiagram";
  if (/^class/.test(t2)) return "classDiagram";
  if (/^er/.test(t2)) return "erDiagram";
  if (/^xychart/.test(t2)) return "xychart-beta";
  if (/^state/.test(t2)) return "stateDiagram-v2";
}
var Xa = /^(?:[\w-]+@)?<?(?:-{2,}|={2,}|-\.+-?|~{3,})/;
function Za(e2) {
  let t2 = [];
  for (let n2 of e2) n2.forEach((e3, n3) => {
    if (n3 === 0 && t2.length > 0 && Xa.test(e3.text)) {
      let n4 = t2[t2.length - 1];
      t2[t2.length - 1] = {
        text: `${n4.text} ${e3.text}`,
        line: n4.line
      };
    } else t2.push(e3);
  });
  return t2;
}
function Qa(e2) {
  let t2 = ie(e2.split("\n").map((e3) => e3.trim())), n2 = Za(g(e2));
  if (n2.length === 0) throw Error("Empty mermaid diagram");
  let i = n2[0], a2 = /^stateDiagram(-v2)?\s*$/i.test(i.text) ? eo(n2) : $a(n2);
  return a2.initConfig = t2, a2;
}
function $a(e2) {
  let t2 = e2[0];
  if (t2 === void 0)
    throw Error("parseFlowchart called with no lines");
  let n2 = t2.text, r = n2.match(/^(?:graph|flowchart)\s+(TD|TB|LR|BT|RL)\s*$/i);
  if (!r) {
    let e3 = n2.match(/^(?:graph|flowchart)\b\s*(.*)$/i);
    if (e3) {
      let r3 = e3[1].trim();
      throw Error(r3.length > 0 ? `Line ${t2.line}: Invalid direction "${r3}" in header "${n2}". Expected one of: TD, TB, LR, BT, RL.` : `Line ${t2.line}: Missing direction in header "${n2}". Expected e.g. "graph TD" or "flowchart LR" \u2014 one of: TD, TB, LR, BT, RL.`);
    }
    let r2 = Ya(n2), i2 = r2 && r2.toLowerCase() !== n2.trim().toLowerCase() ? ` Did you mean "${r2}"?` : "";
    throw Error(`Line ${t2.line}: Invalid mermaid header: "${n2}".${i2} Supported headers: ${Ja}.`);
  }
  let i = {
    direction: ne(r[1]),
    nodes: /* @__PURE__ */ new Map(),
    edges: [],
    subgraphs: [],
    classDefs: /* @__PURE__ */ new Map(),
    classAssignments: /* @__PURE__ */ new Map(),
    nodeStyles: /* @__PURE__ */ new Map(),
    linkStyles: /* @__PURE__ */ new Map(),
    interactions: /* @__PURE__ */ new Map()
  }, a2 = [];
  for (let t3 = 1; t3 < e2.length; t3++) {
    let n3 = e2[t3].text;
    if (be(n3, i) || xe(n3, i) || Ce(n3, i)) continue;
    if (/^click\s+/i.test(n3)) {
      mo(n3, i);
      continue;
    }
    if (go(n3, i)) continue;
    let r2 = n3.match(/^linkStyle\s+(default|[\d,\s]+)\s+(.+)$/);
    if (r2) {
      let e3 = r2[1].trim(), t4 = q(r2[2]);
      if (e3 === "default") i.linkStyles.set("default", {
        ...i.linkStyles.get("default"),
        ...t4
      });
      else {
        let n4 = e3.split(",").map((e4) => parseInt(e4.trim(), 10));
        for (let e4 of n4) isNaN(e4) || i.linkStyles.set(e4, {
          ...i.linkStyles.get(e4),
          ...t4
        });
      }
      continue;
    }
    let s = n3.match(/^direction\s+(TD|TB|LR|BT|RL)\s*$/i);
    if (s && a2.length > 0) {
      a2[a2.length - 1].direction = ne(s[1]);
      continue;
    }
    let l = n3.match(/^subgraph\s+(.+)$/);
    if (l) {
      let e3 = l[1].trim(), t4 = e3.match(/^([^\s[]+)\s*\[(.+)\]$/), n4, r3;
      t4 ? (n4 = t4[1], r3 = he(qa(t4[2]))) : (r3 = he(qa(e3)), n4 = r3.replace(/\s+/g, "_").replace(/[^\p{L}\p{N}_-]/gu, ""));
      let i2 = {
        id: n4,
        label: r3,
        nodeIds: [],
        children: []
      };
      a2.push(i2);
      continue;
    }
    if (n3 === "end") {
      let e3 = a2.pop();
      e3 && (a2.length > 0 ? a2[a2.length - 1].children.push(e3) : i.subgraphs.push(e3));
      continue;
    }
    bo(n3, i, a2);
  }
  return i;
}
function eo(e2) {
  let t2 = {
    direction: "TD",
    nodes: /* @__PURE__ */ new Map(),
    edges: [],
    subgraphs: [],
    classDefs: /* @__PURE__ */ new Map(),
    classAssignments: /* @__PURE__ */ new Map(),
    nodeStyles: /* @__PURE__ */ new Map(),
    linkStyles: /* @__PURE__ */ new Map(),
    interactions: /* @__PURE__ */ new Map()
  }, n2 = [], r = /* @__PURE__ */ new Set(), i = 0, a2 = 0;
  for (let s = 1; s < e2.length; s++) {
    let l = e2[s].text;
    if (be(l, t2) || xe(l, t2) || Ce(l, t2)) continue;
    let u3 = l.match(/^direction\s+(TD|TB|LR|BT|RL)\s*$/i);
    if (u3) {
      n2.length > 0 ? n2[n2.length - 1].direction = ne(u3[1]) : t2.direction = ne(u3[1]);
      continue;
    }
    let d2 = l.match(/^linkStyle\s+(default|[\d,\s]+)\s+(.+)$/);
    if (d2) {
      let e3 = d2[1].trim(), n3 = q(d2[2]);
      if (e3 === "default") t2.linkStyles.set("default", {
        ...t2.linkStyles.get("default"),
        ...n3
      });
      else {
        let r2 = e3.split(",").map((e4) => parseInt(e4.trim(), 10));
        for (let e4 of r2) isNaN(e4) || t2.linkStyles.set(e4, {
          ...t2.linkStyles.get(e4),
          ...n3
        });
      }
      continue;
    }
    if (go(l, t2)) continue;
    let f2 = l.match(/^state\s+(?:"([^"]+)"\s+as\s+)?([\w\p{L}]+)\s*\{$/u);
    if (f2) {
      let e3 = f2[1] ?? f2[2], i2 = f2[2], a3 = {
        id: i2,
        label: e3,
        nodeIds: [],
        children: []
      };
      n2.push(a3), r.add(i2), t2.nodes.delete(i2);
      continue;
    }
    if (l === "}") {
      let e3 = n2.pop();
      e3 && (n2.length > 0 ? n2[n2.length - 1].children.push(e3) : t2.subgraphs.push(e3));
      continue;
    }
    let _3 = l.match(/^state\s+"([^"]+)"\s+as\s+([\w\p{L}]+)\s*$/u);
    if (_3) {
      let e3 = he(_3[1]), r2 = _3[2];
      to(t2, n2, r2, e3);
      continue;
    }
    let v2 = l.match(/^(\[\*\]|[\w\p{L}-]+)(?::::([\w][\w-]*))?\s*(?:([\w-]+)@)?-->\s*(\[\*\]|[\w\p{L}-]+)(?::::([\w][\w-]*))?(?:\s*:\s*(.+))?$/u);
    if (v2) {
      let e3 = v2[1], s2 = v2[2], c = v2[3], l2 = v2[4], u4 = v2[5], d3 = v2[6]?.trim(), f3 = d3 ? he(d3) : void 0;
      e3 === "[*]" ? (i++, e3 = `_start${i > 1 ? i : ""}`, no(t2, n2, {
        id: e3,
        label: "",
        shape: "state-start"
      })) : r.has(e3) || ro(t2, n2, e3), l2 === "[*]" ? (a2++, l2 = `_end${a2 > 1 ? a2 : ""}`, no(t2, n2, {
        id: l2,
        label: "",
        shape: "state-end"
      })) : r.has(l2) || ro(t2, n2, l2), s2 !== void 0 && t2.classAssignments.set(e3, s2), u4 !== void 0 && t2.classAssignments.set(l2, u4), t2.edges.push({
        source: e3,
        target: l2,
        label: f3,
        style: "solid",
        hasArrowStart: false,
        hasArrowEnd: true,
        ...c === void 0 ? {} : { id: c }
      });
      continue;
    }
    let y3 = l.match(/^([\w\p{L}-]+):::([\w][\w-]*)\s*$/u);
    if (y3) {
      let e3 = y3[1];
      r.has(e3) || ro(t2, n2, e3), t2.classAssignments.set(e3, y3[2]);
      continue;
    }
    let b3 = l.match(/^([\w\p{L}-]+)\s*:\s*(.+)$/u);
    if (b3) {
      let e3 = b3[1];
      to(t2, n2, e3, he(b3[2].trim()));
      continue;
    }
  }
  for (let e3 of t2.classAssignments.keys()) !t2.nodes.has(e3) && !r.has(e3) && ro(t2, [], e3);
  return t2;
}
function to(e2, t2, n2, r) {
  let i = e2.nodes.get(n2);
  i && (i.label = r), no(e2, t2, {
    id: n2,
    label: r,
    shape: "rounded"
  });
}
function no(e2, t2, n2) {
  if (e2.nodes.has(n2.id) || e2.nodes.set(n2.id, n2), t2.length > 0) {
    let e3 = t2[t2.length - 1];
    e3.nodeIds.includes(n2.id) || e3.nodeIds.push(n2.id);
  }
}
function ro(e2, t2, n2) {
  if (!e2.nodes.has(n2)) no(e2, t2, {
    id: n2,
    label: n2,
    shape: "rounded"
  });
  else if (t2.length > 0) {
    let e3 = t2[t2.length - 1];
    e3.nodeIds.includes(n2) || e3.nodeIds.push(n2);
  }
}
var io = /^(<|o|x)?(-{2,}|={2,}|-\.+-|~{3,})(>|o|x)?(?:\|([^|]*)\|)?/;
var ao = /* @__PURE__ */ new Set(["--", "=="]);
function oo(e2) {
  if (e2 === "o") return "circle";
  if (e2 === "x") return "cross";
}
var so = /^(<|o|x)?(--|-\.|==)\s+(.+?)\s+(-{2,}[>ox]|={2,}[>ox]|\.+-[>ox]|-{3,}|={3,}|-\.+-)/;
var co = [
  {
    regex: /^([\w\p{L}-]+)\(\(\(((?:"[^"]*"|(?!\)\)\)).)+)\)\)\)/u,
    shape: "doublecircle"
  },
  {
    regex: /^([\w\p{L}-]+)\(\[((?:"[^"]*"|(?!\]\)).)+)\]\)/u,
    shape: "stadium"
  },
  {
    regex: /^([\w\p{L}-]+)\(\(((?:"[^"]*"|(?!\)\)).)+)\)\)/u,
    shape: "circle"
  },
  {
    regex: /^([\w\p{L}-]+)\[\[((?:"[^"]*"|(?!\]\]).)+)\]\]/u,
    shape: "subroutine"
  },
  {
    regex: /^([\w\p{L}-]+)\[\(((?:"[^"]*"|(?!\)\]).)+)\)\]/u,
    shape: "cylinder"
  },
  {
    regex: /^([\w\p{L}-]+)\[\/((?:"[^"]*"|(?![\\/]\]).)+)([\\/])\]/u,
    shape: (e2) => e2 === "\\" ? "trapezoid" : "parallelogram"
  },
  {
    regex: /^([\w\p{L}-]+)\[\\((?:"[^"]*"|(?![\\/]\]).)+)([\\/])\]/u,
    shape: (e2) => e2 === "/" ? "trapezoid-alt" : "parallelogram-alt"
  },
  {
    regex: /^([\w\p{L}-]+)>((?:"[^"]*"|(?!\]).)+)\]/u,
    shape: "asymmetric"
  },
  {
    regex: /^([\w\p{L}-]+)\{\{((?:"[^"]*"|(?!\}\}).)+)\}\}/u,
    shape: "hexagon"
  },
  {
    regex: /^([\w\p{L}-]+)\[((?:"[^"]*"|(?!\]).)+)\]/u,
    shape: "rectangle"
  },
  {
    regex: /^([\w\p{L}-]+)\(((?:"[^"]*"|(?!\)).)+)\)/u,
    shape: "rounded"
  },
  {
    regex: /^([\w\p{L}-]+)\{((?:"[^"]*"|(?!\}).)+)\}/u,
    shape: "diamond"
  }
];
var lo = /^([\w\p{L}]+(?:-[\w\p{L}]+)*)/u;
var uo = /^([\w\p{L}-]+)(?=@\{)/u;
function fo(e2) {
  if (e2.shape) return Re(e2.shape) ?? "rectangle";
  if (e2.icon !== void 0 || e2.img !== void 0) switch (e2.form?.toLowerCase()) {
    case "circle":
      return "circle";
    case "rounded":
      return "rounded";
    default:
      return "rectangle";
  }
  return "rectangle";
}
function po(e2, t2) {
  return t2.label !== void 0 && t2.label.length > 0 ? t2.label : t2.icon ? t2.icon : t2.img ? t2.img : e2;
}
function mo(e2, n2) {
  e(e2, n2.interactions);
}
var ho = /^([\w-]+)(?=@\{)/;
function go(e2, t2) {
  let n2 = e2.match(ho);
  if (!n2 || !t2.edges.some((e3) => e3.id === n2[1])) return false;
  let r = He(e2.slice(n2[1].length));
  return r ? (_o(t2, n2[1], ze(r.body)), true) : false;
}
function _o(e2, t2, n2) {
  for (let r of e2.edges) r.id === t2 && (n2.animate !== void 0 && (r.animate = n2.animate.toLowerCase() !== "false"), n2.animation !== void 0 && (r.animate = true));
}
var vo = /^:::([\w][\w-]*)/;
var yo = /^([\w\p{L}-]+):::([\w][\w-]*)/u;
function bo(e2, t2, n2) {
  let r = e2.trim(), i = xo(r, t2, n2);
  if (!i || i.ids.length === 0) return;
  r = i.remaining.trim();
  let a2 = i.ids;
  for (; r.length > 0; ) {
    let e3, i2, s, c, l, u3, d2, f2 = r.match(/^([\w-]+)@(?=[-=<~ox])/);
    f2 && (d2 = f2[1], r = r.slice(f2[0].length));
    let p3 = r.match(io), m3 = p3?.[2], h3 = p3?.[1], g3 = p3?.[3];
    if (p3 && m3 !== void 0 && !(h3 === void 0 && g3 === void 0 && ao.has(m3))) {
      e3 = h3 !== void 0, l = oo(h3);
      let t3 = p3[4]?.trim();
      c = t3 ? he(t3) : void 0, r = r.slice(p3[0].length).trim(), i2 = Eo(m3), s = g3 !== void 0, u3 = oo(g3);
    } else {
      let t3 = r.match(so);
      if (!t3) break;
      e3 = !!t3[1], l = oo(t3[1]);
      let n3 = t3[3].trim();
      c = n3 ? he(n3) : void 0;
      let a3 = t3[2], d3 = t3[4];
      r = r.slice(t3[0].length).trim(), i2 = Do(a3, d3), u3 = oo(d3.slice(-1)), s = d3.endsWith(">") || u3 !== void 0;
    }
    let _3 = xo(r, t2, n2);
    if (!_3 || _3.ids.length === 0) break;
    r = _3.remaining.trim();
    for (let n3 of a2) for (let r2 of _3.ids) t2.edges.push({
      source: n3,
      target: r2,
      label: c,
      style: i2,
      hasArrowStart: e3,
      hasArrowEnd: s,
      ...l === void 0 ? {} : { startMarker: l },
      ...u3 === void 0 ? {} : { endMarker: u3 },
      ...d2 === void 0 ? {} : { id: d2 }
    });
    a2 = _3.ids;
  }
}
function xo(e2, t2, n2) {
  let r = So(e2, t2, n2);
  if (!r) return null;
  let i = [r.id], a2 = r.remaining.trim();
  for (; a2.startsWith("&"); ) {
    a2 = a2.slice(1).trim();
    let e3 = So(a2, t2, n2);
    if (!e3) break;
    i.push(e3.id), a2 = e3.remaining.trim();
  }
  return {
    ids: i,
    remaining: a2
  };
}
function So(e2, t2, n2) {
  let r = null, i = e2, a2, s = i.match(yo);
  s && (a2 = s[2], i = s[1] + i.slice(s[0].length));
  let c = i.match(uo);
  if (c) {
    let e3 = c[1], a3 = He(i.slice(e3.length));
    if (a3) {
      let s2 = ze(a3.body);
      Co(t2, n2, {
        id: e3,
        label: he(po(e3, s2)),
        shape: fo(s2)
      }), r = e3, i = i.slice(e3.length + a3.length);
    }
  }
  if (r === null) for (let { regex: e3, shape: a3 } of co) {
    let s2 = i.match(e3);
    if (s2) {
      r = s2[1];
      let e4 = he(s2[2]), c2 = typeof a3 == "function" ? a3(s2[3] ?? "") : a3;
      Co(t2, n2, {
        id: r,
        label: e4,
        shape: c2
      }), i = i.slice(s2[0].length);
      break;
    }
  }
  if (r === null) {
    let e3 = i.match(lo);
    e3 && (r = e3[1], t2.nodes.has(r) ? wo(t2, n2, r) || To(n2, r) : Co(t2, n2, {
      id: r,
      label: r,
      shape: "rectangle"
    }), i = i.slice(e3[0].length));
  }
  if (r === null) return null;
  a2 && t2.classAssignments.set(r, a2);
  let l = i.match(vo);
  return l && (t2.classAssignments.set(r, l[1]), i = i.slice(l[0].length)), {
    id: r,
    remaining: i
  };
}
function Co(e2, t2, n2) {
  e2.nodes.has(n2.id) || e2.nodes.set(n2.id, n2), To(t2, n2.id);
}
function wo(e2, t2, n2) {
  let r = (e3) => e3.nodeIds.includes(n2) || e3.children.some(r);
  return e2.subgraphs.some(r) || t2.some(r);
}
function To(e2, t2) {
  if (e2.length > 0) {
    let n2 = e2[e2.length - 1];
    n2.nodeIds.includes(t2) || n2.nodeIds.push(t2);
  }
}
function Eo(e2) {
  return e2.startsWith("~") ? "invisible" : e2.includes(".") ? "dotted" : e2.startsWith("=") ? "thick" : "solid";
}
function Do(e2, t2) {
  return e2.includes(".") || t2.includes(".") ? "dotted" : e2.startsWith("=") || t2.startsWith("=") ? "thick" : "solid";
}
function Oo(e2, t2) {
  let n2 = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Map();
  for (let t3 of e2.subgraphs) ko(t3, n2, r);
  let i = /* @__PURE__ */ new Map(), a2 = 0;
  for (let [t3, r2] of e2.nodes) {
    if (n2.has(t3)) continue;
    let e3 = {
      name: t3,
      displayLabel: ge(r2.label),
      shape: r2.shape,
      index: a2,
      gridCoord: null,
      drawingCoord: null,
      drawing: null,
      drawn: false,
      styleClassName: "",
      styleClass: Vt
    };
    i.set(t3, e3), a2++;
  }
  let o = [...i.values()], s = [], c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map();
  for (let t3 of e2.edges) {
    let a3 = t3.source, o2 = t3.target, u4, d3;
    if (n2.has(a3)) {
      let t4 = r.get(a3), n3 = t4 ? Mo(t4, e2, "exit") : void 0;
      n3 && (a3 = n3), u4 = n3 ? t4 : void 0;
    }
    if (n2.has(o2)) {
      let t4 = r.get(o2), n3 = t4 ? Mo(t4, e2, "entry") : void 0;
      n3 && (o2 = n3), d3 = n3 ? t4 : void 0;
    }
    let p3 = i.get(a3), m3 = i.get(o2);
    if (!p3 || !m3) continue;
    let h3 = {
      from: p3,
      to: m3,
      text: t3.label ? ge(t3.label) : "",
      path: [],
      labelLine: [],
      startDir: {
        x: 0,
        y: 0
      },
      endDir: {
        x: 0,
        y: 0
      },
      style: t3.style,
      hasArrowStart: t3.hasArrowStart,
      hasArrowEnd: t3.hasArrowEnd,
      ...t3.startMarker === void 0 ? {} : { startMarker: t3.startMarker },
      ...t3.endMarker === void 0 ? {} : { endMarker: t3.endMarker }
    };
    s.push(h3), u4 && c.set(h3, u4), d3 && l.set(h3, d3);
  }
  let u3 = [];
  for (let t3 of e2.subgraphs) No(t3, null, i, u3, e2);
  if (Po(e2.subgraphs, u3, i), c.size > 0 || l.size > 0) {
    let t3 = /* @__PURE__ */ new Map();
    Io(e2.subgraphs, u3, t3);
    for (let [e3, n3] of c) {
      let r2 = t3.get(n3);
      r2 && (e3.clusterSource = r2);
    }
    for (let [e3, n3] of l) {
      let r2 = t3.get(n3);
      r2 && (e3.clusterTarget = r2);
    }
  }
  let d2 = e2.classDefs.get("default");
  if (d2) for (let e3 of i.values()) e3.styleClassName = "default", e3.styleClass = {
    name: "default",
    styles: d2
  };
  for (let [t3, n3] of e2.classAssignments) {
    let r2 = i.get(t3), a3 = e2.classDefs.get(n3);
    r2 && a3 && (r2.styleClassName = n3, r2.styleClass = {
      name: n3,
      styles: d2 ? {
        ...d2,
        ...a3
      } : a3
    });
  }
  return {
    nodes: o,
    edges: s,
    canvas: U2(0, 0),
    roleCanvas: Me2(0, 0),
    grid: Ut(),
    columnWidth: /* @__PURE__ */ new Map(),
    rowHeight: /* @__PURE__ */ new Map(),
    subgraphs: u3,
    config: t2,
    offsetX: 0,
    offsetY: 0,
    bundles: []
  };
}
function ko(e2, t2, n2) {
  t2.add(e2.id), n2.set(e2.id, e2);
  for (let r of e2.children) ko(r, t2, n2);
}
function Ao(e2, t2) {
  for (let n2 of e2.nodeIds) t2.add(n2);
  for (let n2 of e2.children) Ao(n2, t2);
}
function jo(e2, t2) {
  let n2 = /* @__PURE__ */ new Set();
  if (Ao(e2, n2), n2.size === 0) return true;
  let r = (t3) => n2.has(t3) || t3 === e2.id;
  return !t2.edges.some((e3) => r(e3.source) !== r(e3.target));
}
function Mo(e2, t2, n2) {
  let r = /* @__PURE__ */ new Set();
  if (Ao(e2, r), r.size === 0) return;
  let i = [...t2.nodes.keys()].filter((e3) => r.has(e3));
  if (i.length === 0) return;
  let a2 = i.filter((e3) => n2 === "entry" ? !t2.edges.some((t3) => t3.target === e3 && r.has(t3.source)) : !t2.edges.some((t3) => t3.source === e3 && r.has(t3.target))), o = a2.length > 0 ? a2 : i;
  return n2 === "entry" ? o[0] : o[o.length - 1];
}
function No(e2, t2, n2, r, i) {
  let a2;
  e2.direction && jo(e2, i) && (a2 = e2.direction === "LR" || e2.direction === "RL" ? "LR" : "TD");
  let o = {
    name: e2.label,
    nodes: [],
    parent: t2,
    children: [],
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
    direction: a2
  };
  for (let t3 of e2.nodeIds) {
    let e3 = n2.get(t3);
    e3 && o.nodes.push(e3);
  }
  r.push(o);
  for (let t3 of e2.children) {
    let e3 = No(t3, o, n2, r, i);
    o.children.push(e3);
    for (let t4 of e3.nodes) o.nodes.includes(t4) || o.nodes.push(t4);
  }
  return o;
}
function Po(e2, t2, n2) {
  let r = /* @__PURE__ */ new Map();
  Io(e2, t2, r);
  let i = /* @__PURE__ */ new Map();
  function a2(e3) {
    let t3 = r.get(e3);
    if (t3) {
      for (let t4 of e3.children) a2(t4);
      for (let n3 of e3.nodeIds) i.has(n3) || i.set(n3, t3);
    }
  }
  for (let t3 of e2) a2(t3);
  for (let e3 of t2) e3.nodes = e3.nodes.filter((t3) => {
    let r2;
    for (let [e4, i2] of n2) if (i2 === t3) {
      r2 = e4;
      break;
    }
    if (!r2) return false;
    let a3 = i.get(r2);
    return !a3 || Fo(e3, a3);
  });
}
function Fo(e2, t2) {
  let n2 = t2;
  for (; n2 !== null; ) {
    if (n2 === e2) return true;
    n2 = n2.parent;
  }
  return false;
}
function Io(e2, t2, n2) {
  let r = [];
  function i(e3) {
    for (let t3 of e3) r.push(t3), i(t3.children);
  }
  i(e2);
  for (let e3 = 0; e3 < r.length && e3 < t2.length; e3++) {
    let i2 = r[e3], a2 = t2[e3];
    !i2 || !a2 || n2.set(i2, a2);
  }
}
function Lo(e2, t2, n2, r, i = {}) {
  return Ro(b(Qa(e2), i.direction), t2, n2, r, i);
}
function Ro(e2, t2, n2, r, i) {
  t2.graphDirection = e2.direction === "LR" || e2.direction === "RL" ? "LR" : "TD";
  let a2 = Oo(e2, t2);
  ri(a2), ha(a2);
  let o = i.hyperlinks ? ce2(a2, e2.interactions) : void 0;
  return e2.direction === "BT" && (qe(a2.canvas, a2.roleCanvas, a2.labelRects ?? [], o), Ke(a2.canvas, a2.roleCanvas), Ye(a2.roleCanvas), o && I2(o)), e2.direction === "RL" && (Qe(a2.canvas, a2.roleCanvas, a2.labelRects ?? [], o), Ze(a2.canvas, a2.roleCanvas), et(a2.roleCanvas), o && L2(o)), We(a2.canvas, {
    roleCanvas: a2.roleCanvas,
    colorMode: n2,
    theme: r,
    linkCanvas: o
  });
}
function zo(e2, t2, n2, r, i = {}) {
  let a2 = S2(_2(_(e2)));
  return Ro(b(a2, i.direction), t2, n2, r, i);
}
var Bo = 28;
var Vo = 2;
function Ho(e2, t2) {
  let n2 = new Map(e2.map((e3) => [e3, e3])), r = (e3) => {
    let t3 = e3;
    for (; n2.get(t3) !== t3; ) t3 = n2.get(t3);
    return t3;
  }, i = new Set(e2);
  for (let e3 of t2) {
    let t3 = he2(e3);
    if (t3.axis === "horizontal" && i.has(t3.source) && i.has(t3.target)) {
      let e4 = r(t3.source), i2 = r(t3.target);
      e4 !== i2 && n2.set(i2, e4);
    }
  }
  let a2 = /* @__PURE__ */ new Map();
  for (let t3 of e2) a2.set(r(t3), a2.get(r(t3)) ?? /* @__PURE__ */ new Set());
  for (let e3 of t2) {
    let t3 = he2(e3);
    if (t3.axis === "horizontal" || !i.has(t3.source) || !i.has(t3.target)) continue;
    let n3 = r(t3.source), o2 = r(t3.target);
    n3 !== o2 && a2.get(n3).add(o2);
  }
  let o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), c = (e3) => {
    o.set(e3, 1);
    let t3 = [];
    for (let n3 of a2.get(e3) ?? []) {
      let e4 = o.get(n3) ?? 0;
      e4 !== 1 && (t3.push(n3), e4 === 0 && c(n3));
    }
    s.set(e3, t3), o.set(e3, 2);
  };
  for (let e3 of a2.keys()) o.has(e3) || c(e3);
  let l = /* @__PURE__ */ new Map(), u3 = (e3) => {
    let t3 = l.get(e3);
    if (t3 !== void 0) return t3;
    l.set(e3, 0);
    let n3 = 0;
    for (let [t4, r2] of s) r2.includes(e3) && (n3 = Math.max(n3, u3(t4) + 1));
    return l.set(e3, n3), n3;
  }, d2 = /* @__PURE__ */ new Map();
  for (let t3 of e2) d2.set(t3, u3(r(t3)));
  return d2;
}
var Uo = [
  " o ",
  "/|\\",
  "/ \\"
];
function Wo(e2) {
  let t2 = [];
  return e2.kind === "person" && t2.push(...Uo), t2.push(...ue(e2.label, Bo), fe(e2)), e2.description && t2.push("", ...ue(e2.description, Bo)), {
    lines: t2,
    glyph: e2.kind === "person"
  };
}
function Go(e2, t2) {
  let { lines: n2, glyph: r } = Wo(e2), i = Math.max(...n2.map(H2)), a2 = e2.shape === "db" ? 2 : 0;
  return {
    kind: "el",
    el: e2,
    lines: n2,
    glyph: r,
    order: t2,
    rank: 0,
    box: {
      x: 0,
      y: 0,
      w: Math.max(14, i + 4),
      h: n2.length + 2 + a2
    }
  };
}
function Ko(e2, t2, n2, r, i = {}) {
  let a2 = b(le(_(e2)), i.direction);
  if (a2.elements.length === 0 && a2.boundaries.length === 0) return "";
  let o = t2.useAscii, s = It(t2.paddingX, 5, 6, 4), c = It(t2.paddingY, 5, 4, 3) + +!!a2.relationships.some((e3) => me(e3).length > 1), l = /* @__PURE__ */ new Map();
  for (let [e3, t3] of a2.elements.entries()) l.set(t3.alias, Go(t3, e3));
  let d2 = Ho([...a2.elements.map((e3) => e3.alias), ...qo(a2.boundaries)], a2.relationships);
  for (let [e3, t3] of l) t3.rank = d2.get(e3) ?? 0;
  let f2 = /* @__PURE__ */ new Map(), p3 = /* @__PURE__ */ new Set(), m3 = (e3) => {
    let t3 = [];
    for (let n4 of e3.elementAliases) p3.add(n4), t3.push(l.get(n4));
    for (let n4 of e3.children) t3.push(m3(n4));
    let n3 = pe2(e3), r2 = n3 ? 2 : 1;
    if (t3.length === 0) {
      let t4 = [...ue(e3.label, Bo)];
      n3 && t4.push(n3);
      let i3 = {
        kind: "b",
        b: e3,
        rows: [],
        vgaps: [],
        headerH: r2,
        order: 2 ** 53 - 1,
        rank: d2.get(e3.alias) ?? 0,
        box: {
          x: 0,
          y: 0,
          w: Math.max(14, Math.max(...t4.map(H2)) + 4),
          h: t4.length + 2
        }
      };
      return f2.set(e3.alias, i3), i3;
    }
    let i2 = {
      kind: "b",
      b: e3,
      rows: [],
      vgaps: [],
      headerH: r2,
      order: 0,
      rank: 0,
      box: {
        x: 0,
        y: 0,
        w: 0,
        h: 0
      }
    };
    i2.rows = Zo(t3, a2), a2.direction === "BT" && i2.rows.reverse(), i2.vgaps = es(i2.rows, a2, c), f2.set(e3.alias, i2);
    let o2 = i2.rows.flat();
    return i2.order = Math.min(...o2.map((e4) => e4.order)), i2.rank = Math.min(...o2.map((e4) => e4.rank)), Qo(i2, s), i2;
  }, h3 = a2.boundaries.map(m3), g3 = Zo([...a2.elements.filter((e3) => !p3.has(e3.alias)).map((e3) => l.get(e3.alias)), ...h3], a2);
  a2.direction === "BT" && g3.reverse();
  let v2 = es(g3, a2, c), y3 = a2.title ? 2 : 0, x3 = (e3, t3, n3, r2, i2) => {
    let o2 = r2;
    for (let [r3, c2] of e3.entries()) {
      let e4 = Xo(c2, a2, s), l2 = c2.reduce((e5, t4) => e5 + t4.box.w, 0) + Jo(e4), u3 = n3 + Math.floor((i2 - l2) / 2), d3 = Math.max(...c2.map((e5) => e5.box.h));
      c2.forEach((t4, n4) => {
        C3(t4, u3, o2 + Math.floor((d3 - t4.box.h) / 2)), u3 += t4.box.w + (e4[n4] ?? 0);
      }), o2 += d3 + (t3[r3] ?? 0);
    }
  }, C3 = (e3, t3, n3) => {
    e3.box.x = t3, e3.box.y = n3, e3.kind === "b" && e3.rows.length > 0 && x3(e3.rows, e3.vgaps, t3 + 2, n3 + e3.headerH + 2, e3.box.w - 4);
  }, ee3 = Math.max(...g3.map((e3) => e3.reduce((e4, t3) => e4 + t3.box.w, 0) + Jo(Xo(e3, a2, s))));
  x3(g3, v2, Vo, Vo + y3, ee3);
  let w2 = 0, T3 = 0, E2 = [...l.values(), ...f2.values()].map((e3) => e3.box);
  for (let e3 of E2) w2 = Math.max(w2, e3.x + e3.w), T3 = Math.max(T3, e3.y + e3.h);
  let O3 = w2 + Vo + 1, k3 = T3 + Vo + 1, te3 = U2(O3, k3), ne3 = Me2(O3, k3), A3 = (e3, t3, n3, r2) => G(te3, e3, t3, n3, {
    role: r2,
    roleCanvas: ne3
  }), re3 = (e3, t3, n3, r2) => {
    let i2 = e3;
    for (let e4 of je2(n3)) A3(i2, t3, e4, r2), i2++;
  }, ie4 = Array.from({ length: O3 + 1 }, () => Array(k3 + 1).fill(0)), M4 = Array.from({ length: O3 + 1 }, () => Array(k3 + 1).fill(false)), ae3 = (e3) => {
    for (let t3 = e3.x; t3 < e3.x + e3.w; t3++) for (let n3 = e3.y; n3 < e3.y + e3.h; n3++) M4[t3][n3] = true;
  };
  if (a2.title) {
    let e3 = H2(a2.title);
    re3(Math.max(0, Math.floor((O3 - e3) / 2)), 1, a2.title, "text");
    for (let e4 = 0; e4 < O3; e4++) M4[e4][1] = true;
  }
  let N3 = (e3) => {
    let { x: t3, y: n3, w: r2, h: i2 } = e3.box, a3 = o ? "-" : "\u254C", s2 = o ? ":" : "\u254E", [c2, l2, u3, d3] = o ? [
      "+",
      "+",
      "+",
      "+"
    ] : [
      "\u256D",
      "\u256E",
      "\u2570",
      "\u256F"
    ];
    for (let e4 = 0; e4 < r2; e4++) ie4[t3 + e4][n3] |= as, ie4[t3 + e4][n3 + i2 - 1] |= as;
    for (let e4 = 0; e4 < i2; e4++) ie4[t3][n3 + e4] |= os, ie4[t3 + r2 - 1][n3 + e4] |= os;
    for (let e4 = 1; e4 < r2 - 1; e4++) A3(t3 + e4, n3, a3, "border"), A3(t3 + e4, n3 + i2 - 1, a3, "border");
    for (let e4 = 1; e4 < i2 - 1; e4++) A3(t3, n3 + e4, s2, "border"), A3(t3 + r2 - 1, n3 + e4, s2, "border");
    if (A3(t3, n3, c2, "border"), A3(t3 + r2 - 1, n3, l2, "border"), A3(t3, n3 + i2 - 1, u3, "border"), A3(t3 + r2 - 1, n3 + i2 - 1, d3, "border"), e3.rows.length > 0) {
      re3(t3 + 2, n3 + 1, e3.b.label, "text");
      let i3 = pe2(e3.b);
      i3 && re3(t3 + 2, n3 + 2, i3, "text");
      let a4 = Math.max(H2(e3.b.label), H2(i3 ?? "")) + 2;
      for (let i4 = 1; i4 <= a4 && t3 + i4 < t3 + r2 - 1; i4++) for (let r3 = 1; r3 <= e3.headerH; r3++) M4[t3 + i4][n3 + r3] = true;
    } else {
      let i3 = [...ue(e3.b.label, Bo)], a4 = pe2(e3.b);
      a4 && i3.push(a4), i3.forEach((e4, i4) => re3(t3 + Math.floor((r2 - H2(e4)) / 2), n3 + 1 + i4, e4, "text")), ae3(e3.box);
    }
  }, P3 = (e3) => {
    for (let t3 of e3) t3.kind === "b" && (N3(t3), P3(t3.rows.flat()));
  };
  P3(g3.flat());
  let oe3 = (e3) => {
    let { x: t3, y: n3, w: r2, h: i2 } = e3.box, a3 = e3.el, s2 = a3.external, c2 = o ? s2 ? "." : "-" : s2 ? "\u2504" : "\u2500", l2 = o ? s2 ? ":" : "|" : s2 ? "\u2506" : "\u2502", u3 = a3.kind === "person" || a3.shape !== "default", [d3, f3, p4, m4] = o ? [
      "+",
      "+",
      "+",
      "+"
    ] : u3 ? [
      "\u256D",
      "\u256E",
      "\u2570",
      "\u256F"
    ] : [
      "\u250C",
      "\u2510",
      "\u2514",
      "\u2518"
    ];
    for (let e4 = 1; e4 < r2 - 1; e4++) A3(t3 + e4, n3, c2, "border"), A3(t3 + e4, n3 + i2 - 1, c2, "border");
    let h4 = a3.shape === "queue" ? "(" : l2, g4 = a3.shape === "queue" ? ")" : l2;
    for (let e4 = 1; e4 < i2 - 1; e4++) A3(t3, n3 + e4, h4, "border"), A3(t3 + r2 - 1, n3 + e4, g4, "border");
    A3(t3, n3, d3, "border"), A3(t3 + r2 - 1, n3, f3, "border"), A3(t3, n3 + i2 - 1, p4, "border"), A3(t3 + r2 - 1, n3 + i2 - 1, m4, "border");
    let _3 = n3 + 1;
    if (a3.shape === "db") {
      let e4 = o ? "+" : "\u251C", a4 = o ? "+" : "\u2524";
      for (let o2 of [n3 + 1, n3 + i2 - 2]) {
        A3(t3, o2, e4, "junction"), A3(t3 + r2 - 1, o2, a4, "junction");
        for (let e5 = 1; e5 < r2 - 1; e5++) A3(t3 + e5, o2, c2, "border");
      }
      _3 = n3 + 2;
    }
    e3.lines.forEach((n4, i3) => {
      let a4 = e3.glyph && i3 < Uo.length, o2 = H2(n4);
      re3(t3 + Math.floor((r2 - o2) / 2), _3 + i3, n4, a4 ? "border" : "text");
    }), ae3(e3.box);
  };
  for (let e3 of l.values()) oe3(e3);
  let F3 = (e3) => {
    let t3 = l.get(e3);
    return t3 ? {
      box: t3.box,
      boundary: false
    } : {
      box: f2.get(e3).box,
      boundary: true
    };
  }, I3 = Array.from({ length: O3 + 1 }, () => Array(k3 + 1).fill(0)), L3 = /* @__PURE__ */ new Map(), se3 = [];
  for (let e3 of a2.relationships) {
    if (e3.from === e3.to) continue;
    let t3 = F3(e3.from), n3 = F3(e3.to), r2 = [];
    t3.boundary && f2.get(e3.from).rows.length > 0 && r2.push(t3.box), n3.boundary && f2.get(e3.to).rows.length > 0 && r2.push(n3.box);
    let i2 = ms(t3.box, n3.box, {
      width: O3,
      height: k3,
      blocked: M4,
      masks: I3,
      arrows: L3,
      borders: ie4
    }, r2);
    if (!i2) continue;
    se3.push({
      rel: e3,
      path: i2
    }), fs(i2, I3, t3.box, n3.box);
    let a3 = i2[i2.length - 1], s2 = i2[0];
    (!e3.reversed || e3.bidirectional) && L3.set(`${a3[0]},${a3[1]}`, cs(ss(a3, n3.box), o)), (e3.bidirectional || e3.reversed) && L3.set(`${s2[0]},${s2[1]}`, cs(ss(s2, t3.box), o));
  }
  for (let e3 = 0; e3 <= O3; e3++) for (let t3 = 0; t3 <= k3; t3++) {
    let n3 = I3[e3][t3];
    if (n3 === 0) continue;
    let r2 = L3.get(`${e3},${t3}`);
    r2 ? A3(e3, t3, r2, "arrow") : A3(e3, t3, us(n3, o), ds(n3) ? "corner" : "line");
  }
  for (let [e3, t3] of L3) {
    let [n3, r2] = e3.split(",").map(Number);
    A3(n3, r2, t3, "arrow");
  }
  let ce3 = (e3, t3) => e3 >= 0 && t3 >= 0 && e3 <= O3 && t3 <= k3 && te3[e3][t3] === " " && !M4[e3][t3], le3 = (e3, t3) => e3 >= 0 && t3 >= 0 && e3 <= O3 && t3 <= k3 && !M4[e3][t3] && !L3.has(`${e3},${t3}`) && (te3[e3][t3] === " " || I3[e3][t3] !== 0);
  for (let { rel: e3, path: t3 } of se3) {
    let n3 = me(e3);
    if (n3.length === 0) continue;
    let r2 = Math.max(...n3.map(H2)), i2 = [n3];
    for (let e4 of [
      18,
      12,
      8,
      6
    ]) r2 > e4 && i2.push(n3.flatMap((t4, n4) => n4 === 0 ? ue(t4, e4) : [t4]));
    let a3 = (e4) => i2.some((n4) => gs(n4, t3, ce3, le3, re3, e4));
    a3(false) || a3(true);
  }
  return We(te3, {
    roleCanvas: ne3,
    colorMode: n2,
    theme: r
  });
}
function qo(e2) {
  return e2.flatMap((e3) => e3.elementAliases.length === 0 && e3.children.length === 0 ? [e3.alias] : qo(e3.children));
}
var Jo = (e2) => e2.reduce((e3, t2) => e3 + t2, 0);
function Yo(e2, t2, n2) {
  let r = (e3, t3) => e3.kind === "el" ? e3.el.alias === t3 : e3.b.alias === t3, i = 0;
  for (let a2 of n2.relationships) {
    let n3 = he2(a2);
    n3.axis === "horizontal" && (r(e2, n3.source) && r(t2, n3.target) || r(t2, n3.source) && r(e2, n3.target)) && (i = Math.max(i, ...me(a2).map(H2)));
  }
  return i;
}
function Xo(e2, t2, n2) {
  let r = [];
  for (let i = 0; i < e2.length - 1; i++) {
    let a2 = Yo(e2[i], e2[i + 1], t2);
    r.push(Math.max(n2, a2 > 0 ? a2 + 4 : 0));
  }
  return r;
}
function Zo(e2, t2) {
  let n2 = /* @__PURE__ */ new Map();
  for (let t3 of e2) n2.set(t3.rank, [...n2.get(t3.rank) ?? [], t3]);
  let r = [...n2.entries()].sort((e3, t3) => e3[0] - t3[0]).map(([, e3]) => e3.sort((e4, t3) => e4.order - t3.order)), i = (e3) => e3.kind === "el" ? e3.el.alias : e3.b.alias;
  for (let e3 of r) for (let n3 = 0; n3 < e3.length; n3++) {
    let n4 = false;
    for (let r2 of t2.relationships) {
      let t3 = he2(r2);
      if (t3.axis !== "horizontal") continue;
      let a2 = e3.map(i), o = a2.indexOf(t3.source), s = a2.indexOf(t3.target);
      if (o < 0 || s < 0 || o < s) continue;
      let [c] = e3.splice(o, 1);
      e3.splice(s, 0, c), n4 = true;
    }
    if (!n4) break;
  }
  return r;
}
function Qo(e2, t2) {
  let n2 = 0, r = e2.headerH + 2;
  for (let [i2, a2] of e2.rows.entries()) {
    let o = Jo(a2.map((e3) => e3.box.w)) + (a2.length - 1) * t2;
    n2 = Math.max(n2, o), r += Math.max(...a2.map((e3) => e3.box.h)) + (e2.vgaps[i2] ?? 0);
  }
  let i = Math.max(H2(e2.b.label), H2(pe2(e2.b) ?? ""));
  e2.box.w = Math.max(n2, i) + 4, e2.box.h = r + 2;
}
function $o(e2, t2 = /* @__PURE__ */ new Set()) {
  if (e2.kind === "el") t2.add(e2.el.alias);
  else {
    t2.add(e2.b.alias);
    for (let n2 of e2.rows) for (let e3 of n2) $o(e3, t2);
  }
  return t2;
}
function es(e2, t2, n2) {
  let r = /* @__PURE__ */ new Map();
  e2.forEach((e3, t3) => {
    for (let n3 of e3) for (let e4 of $o(n3)) r.set(e4, t3);
  });
  let i = e2.map(() => 0);
  for (let e3 of t2.relationships) {
    let t3 = r.get(e3.from), n3 = r.get(e3.to);
    if (t3 === void 0 || n3 === void 0 || t3 === n3) continue;
    let a2 = me(e3).length;
    if (a2 !== 0) for (let e4 = Math.min(t3, n3); e4 < Math.max(t3, n3); e4++) i[e4] = i[e4] + a2 + 1;
  }
  return e2.slice(0, -1).map((e3, t3) => Math.max(n2, i[t3] + 1));
}
var ts = 1;
var ns = 2;
var rs = 4;
var is = 8;
var as = 1;
var os = 2;
function ss(e2, t2) {
  let [n2, r] = e2;
  return r < t2.y ? ns : r >= t2.y + t2.h ? ts : n2 < t2.x ? is : rs;
}
function cs(e2, t2) {
  return e2 === ns ? t2 ? "v" : "\u25BC" : e2 === ts ? t2 ? "^" : "\u25B2" : e2 === is ? t2 ? ">" : "\u25BA" : t2 ? "<" : "\u25C4";
}
var ls = {
  [ts]: "\u2502",
  [ns]: "\u2502",
  3: "\u2502",
  [rs]: "\u2500",
  [is]: "\u2500",
  12: "\u2500",
  10: "\u250C",
  6: "\u2510",
  9: "\u2514",
  5: "\u2518",
  11: "\u251C",
  7: "\u2524",
  14: "\u252C",
  13: "\u2534",
  15: "\u253C"
};
function us(e2, t2) {
  let n2 = ls[e2] ?? "\u253C";
  return t2 ? n2 === "\u2502" ? "|" : n2 === "\u2500" ? "-" : "+" : n2;
}
function ds(e2) {
  return e2 === 10 || e2 === 6 || e2 === 9 || e2 === 5;
}
function fs(e2, t2, n2, r) {
  let i = (e3, t3) => t3[0] > e3[0] ? is : t3[0] < e3[0] ? rs : t3[1] > e3[1] ? ns : ts, a2 = (e3) => e3 === ts ? ns : e3 === ns ? ts : e3 === rs ? is : rs;
  for (let n3 = 0; n3 < e2.length; n3++) {
    let [r2, o2] = e2[n3];
    n3 > 0 && (t2[r2][o2] |= a2(i(e2[n3 - 1], e2[n3]))), n3 < e2.length - 1 && (t2[r2][o2] |= i(e2[n3], e2[n3 + 1]));
  }
  let o = e2[0], s = e2[e2.length - 1];
  t2[o[0]][o[1]] |= ss(o, n2), t2[s[0]][s[1]] |= ss(s, r);
}
function ps(e2, t2, n2) {
  let r = [], i = e2.x + e2.w / 2, a2 = e2.y + e2.h / 2, o = t2.x + t2.w / 2, s = t2.y + t2.h / 2, c = t2.y < e2.y + e2.h && e2.y < t2.y + t2.h, l = /* @__PURE__ */ new Set();
  c ? l.add(o > i ? is : rs) : l.add(s > a2 ? ns : ts);
  let u3 = (e3) => l.has(e3) ? 0 : e3 === ns && l.has(ts) || e3 === ts && l.has(ns) || e3 === rs && l.has(is) || e3 === is && l.has(rs) ? 14 : 7, d2 = (e3, t3, i2, a3) => {
    e3 < 0 || t3 < 0 || e3 > n2.width || t3 > n2.height || n2.blocked[e3][t3] || r.push({
      cell: [e3, t3],
      cost: u3(i2) + Math.abs(a3) * 0.2
    });
  };
  for (let t3 = e2.x + 1; t3 < e2.x + e2.w - 1; t3++) d2(t3, e2.y - 1, ts, t3 - i), d2(t3, e2.y + e2.h, ns, t3 - i);
  for (let t3 = e2.y + 1; t3 < e2.y + e2.h - 1; t3++) d2(e2.x - 1, t3, rs, t3 - a2), d2(e2.x + e2.w, t3, is, t3 - a2);
  return r;
}
function ms(e2, t2, n2, r) {
  let i = (e3, t3) => r.some((n3) => e3 >= n3.x && e3 < n3.x + n3.w && t3 >= n3.y && t3 < n3.y + n3.h), a2 = ps(e2, t2, n2).filter((e3) => !i(...e3.cell)), o = /* @__PURE__ */ new Map();
  for (let r2 of ps(t2, e2, n2)) i(...r2.cell) || o.set(`${r2.cell[0]},${r2.cell[1]}`, r2.cost);
  if (a2.length === 0 || o.size === 0) return;
  let s = (e3, n3) => (e3 < t2.x ? t2.x - e3 : e3 >= t2.x + t2.w ? e3 - (t2.x + t2.w - 1) : 0) + (n3 < t2.y ? t2.y - n3 : n3 >= t2.y + t2.h ? n3 - (t2.y + t2.h - 1) : 0), c = [], l = /* @__PURE__ */ new Map();
  for (let e3 of a2) {
    let [t3, n3] = e3.cell;
    c.push({
      x: t3,
      y: n3,
      dir: 0,
      g: e3.cost,
      f: e3.cost + s(t3, n3),
      parent: void 0
    }), l.set(`${t3},${n3},0`, e3.cost);
  }
  let u3 = [
    [
      0,
      -1,
      ts
    ],
    [
      0,
      1,
      ns
    ],
    [
      -1,
      0,
      rs
    ],
    [
      1,
      0,
      is
    ]
  ], d2 = 0;
  for (; c.length > 0 && d2++ < 2e5; ) {
    let e3 = 0;
    for (let t4 = 1; t4 < c.length; t4++) c[t4].f < c[e3].f && (e3 = t4);
    let t3 = c.splice(e3, 1)[0], r2 = `${t3.x},${t3.y}`;
    if (o.get(r2) !== void 0) {
      let e4 = [];
      for (let n3 = t3; n3; n3 = n3.parent) e4.push([n3.x, n3.y]);
      return e4.reverse();
    }
    for (let [e4, r3, a3] of u3) {
      let u4 = t3.x + e4, d3 = t3.y + r3;
      if (u4 < 0 || d3 < 0 || u4 > n2.width || d3 > n2.height) continue;
      let f2 = o.has(`${u4},${d3}`);
      if (n2.blocked[u4][d3] && !f2 || i(u4, d3) || n2.arrows.has(`${u4},${d3}`)) continue;
      let p3 = 1;
      t3.dir !== 0 && t3.dir !== a3 && (p3 += 2);
      let m3 = n2.borders[u4][d3];
      m3 !== 0 && (a3 === rs || a3 === is ? (m3 & as) !== 0 : (m3 & os) !== 0) && (p3 += 12);
      let h3 = n2.masks[u4][d3];
      if (h3 !== 0) {
        let e5 = a3 === rs || a3 === is, t4 = !!(h3 & 12), n3 = !!(h3 & 3);
        p3 += e5 && t4 || !e5 && n3 ? 8 : 3;
      }
      let g3 = t3.g + p3 + (f2 ? o.get(`${u4},${d3}`) ?? 0 : 0), _3 = `${u4},${d3},${a3}`;
      (l.get(_3) ?? Infinity) <= g3 || (l.set(_3, g3), c.push({
        x: u4,
        y: d3,
        dir: a3,
        g: g3,
        f: g3 + s(u4, d3),
        parent: t3
      }));
    }
  }
}
function hs(e2) {
  let t2 = [], n2 = 0;
  for (; n2 < e2.length - 1; ) {
    let r = e2[n2 + 1][1] === e2[n2][1], i = n2 + 1;
    for (; i < e2.length - 1 && e2[i + 1][1] === e2[i][1] === r; ) i++;
    let [a2, o] = e2[n2], [s, c] = e2[i];
    t2.push({
      horizontal: r,
      x0: Math.min(a2, s),
      y0: Math.min(o, c),
      len: Math.abs(s - a2) + Math.abs(c - o) + 1
    }), n2 = i;
  }
  return t2;
}
function gs(e2, t2, n2, r, i, a2) {
  let o = e2.map(H2), s = (e3) => e3.every(([e4, t3], r2) => {
    let i2 = o[r2];
    for (let r3 = 0; r3 < i2; r3++) if (!n2(e4 + r3, t3)) return false;
    return n2(e4 - 1, t3) && n2(e4 + i2, t3);
  }), c = (e3) => Array.from({ length: e3 }, (e4, t3) => t3).sort((t3, n3) => Math.abs(t3 - e3 / 2) - Math.abs(n3 - e3 / 2));
  for (let n3 of a2 ? [] : hs(t2).sort((e3, t3) => t3.len - e3.len)) for (let t3 of c(n3.len)) {
    let r2 = [];
    if (n3.horizontal) {
      let i2 = n3.x0 + t3;
      r2.push(e2.map((e3, t4) => [i2 - Math.floor(o[t4] / 2), t4 === 0 ? n3.y0 - 1 : n3.y0 + t4])), e2.length === 1 && r2.push([[i2 - Math.floor(o[0] / 2), n3.y0 + 1]]);
    } else {
      let i2 = n3.y0 + t3 - Math.floor((e2.length - 1) / 2);
      for (let t4 of [1, -1]) r2.push(e2.map((e3, r3) => [t4 > 0 ? n3.x0 + 2 : n3.x0 - 1 - o[r3], i2 + r3]));
    }
    for (let t4 of r2) if (s(t4)) return t4.forEach(([t5, n4], r3) => i(t5, n4, e2[r3], "text")), true;
  }
  let l = (e3) => e3.every(([e4, t3], n3) => {
    for (let i2 = 0; i2 < o[n3]; i2++) if (!r(e4 + i2, t3)) return false;
    return true;
  });
  for (let n3 of a2 ? hs(t2).sort((e3, t3) => t3.len - e3.len) : []) for (let t3 of c(n3.len)) {
    let r2 = e2.map((r3, i2) => n3.horizontal ? [n3.x0 + t3 - Math.floor(o[i2] / 2), n3.y0 + i2 - +(e2.length > 1)] : [n3.x0 - Math.floor(o[i2] / 2), n3.y0 + t3 + i2]);
    if (l(r2)) return r2.forEach(([t4, n4], r3) => i(t4, n4, e2[r3], "text")), true;
  }
  return false;
}
var _s = {
  xychart: (e2, t2, n2, r) => ut(e2, t2, n2, r),
  er: (e2, t2, n2, r) => Sa(e2, t2, n2, r),
  sequence: (e2, t2, n2, r) => Oa(e2, t2, n2, r),
  class: (e2, t2, n2, r, i) => Ua(e2, t2, n2, r, i),
  flowchart: (e2, t2, n2, r, i) => Lo(e2, t2, n2, r, i),
  architecture: (e2, t2, n2, r, i) => zo(e2, t2, n2, r, i),
  c4: (e2, t2, n2, r, i) => Ko(e2, t2, n2, r, i)
};
var vs = /\x1b\[[0-9;]*m/g;
function ys(e2) {
  let t2 = e2.split("\n"), n2 = t2.reduce((e3, t3) => Math.max(e3, P2(t3.replace(vs, "")).length), 0), r = String(Math.max(0, t2.length - 1)).length, i = " ".repeat(r + 1);
  return [
    i + Array.from({ length: n2 }, (e3, t3) => String(Math.floor(t3 / 10) % 10)).join(""),
    i + Array.from({ length: n2 }, (e3, t3) => String(t3 % 10)).join(""),
    ...t2.map((e3, t3) => `${String(t3).padStart(r, " ")} ${e3}`)
  ].join("\n");
}
function bs(e2, t2 = {}) {
  let r = {
    useAscii: t2.useAscii ?? false,
    paddingX: t2.paddingX ?? 5,
    paddingY: t2.paddingY ?? 5,
    boxBorderPadding: t2.boxBorderPadding ?? 1,
    graphDirection: "TD"
  }, i = t2.colorMode === "auto" || t2.colorMode === void 0 ? de2() : t2.colorMode, a2 = {
    ...z2,
    ...t2.theme
  }, o = _s[te(e2)](e2, r, i, a2, {
    hyperlinks: t2.hyperlinks ?? false,
    direction: t2.direction
  });
  return t2.showCoords ? ys(o) : o;
}
var xs = bs;
export {
  xs as renderMermaidAscii
};
