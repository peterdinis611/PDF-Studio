var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// node_modules/alpinejs/dist/module.esm.js
var flushPending = false;
var flushing = false;
var queue = [];
var lastFlushedIndex = -1;
var transactionActive = false;
function scheduler(callback) {
  queueJob(callback);
}
function startTransaction() {
  transactionActive = true;
}
function commitTransaction() {
  transactionActive = false;
  queueFlush();
}
function queueJob(job) {
  if (!queue.includes(job))
    queue.push(job);
  queueFlush();
}
function dequeueJob(job) {
  let index = queue.indexOf(job);
  if (index !== -1 && index > lastFlushedIndex)
    queue.splice(index, 1);
}
function queueFlush() {
  if (!flushing && !flushPending) {
    if (transactionActive)
      return;
    flushPending = true;
    queueMicrotask(flushJobs);
  }
}
function flushJobs() {
  flushPending = false;
  flushing = true;
  for (let i = 0; i < queue.length; i++) {
    queue[i]();
    lastFlushedIndex = i;
  }
  queue.length = 0;
  lastFlushedIndex = -1;
  flushing = false;
}
var reactive;
var effect;
var release;
var raw;
var shouldSchedule = true;
function disableEffectScheduling(callback) {
  shouldSchedule = false;
  callback();
  shouldSchedule = true;
}
function setReactivityEngine(engine) {
  reactive = engine.reactive;
  release = engine.release;
  effect = (callback) => engine.effect(callback, { scheduler: (task) => {
    if (shouldSchedule) {
      scheduler(task);
    } else {
      task();
    }
  } });
  raw = engine.raw;
}
function overrideEffect(override) {
  effect = override;
}
function elementBoundEffect(el) {
  let cleanup2 = () => {
  };
  let wrappedEffect = (callback) => {
    let effectReference = effect(callback);
    if (!el._x_effects) {
      el._x_effects = /* @__PURE__ */ new Set();
      el._x_runEffects = () => {
        el._x_effects.forEach((i) => i());
      };
    }
    el._x_effects.add(effectReference);
    cleanup2 = () => {
      if (effectReference === void 0)
        return;
      el._x_effects.delete(effectReference);
      release(effectReference);
    };
    return effectReference;
  };
  return [wrappedEffect, () => {
    cleanup2();
  }];
}
function watch(getter, callback) {
  let firstTime = true;
  let oldValue;
  let oldValueJSON;
  let effectReference = effect(() => {
    let value = getter();
    let newJSON = JSON.stringify(value);
    if (!firstTime) {
      if (typeof value === "object" || value !== oldValue) {
        let previousValue = typeof oldValue === "object" ? JSON.parse(oldValueJSON) : oldValue;
        queueMicrotask(() => {
          callback(value, previousValue);
        });
      }
    }
    oldValue = value;
    oldValueJSON = newJSON;
    firstTime = false;
  });
  return () => release(effectReference);
}
async function transaction(callback) {
  startTransaction();
  try {
    await callback();
    await Promise.resolve();
  } finally {
    commitTransaction();
  }
}
var onAttributeAddeds = [];
var onElRemoveds = [];
var onElAddeds = [];
function onElAdded(callback) {
  onElAddeds.push(callback);
}
function onElRemoved(el, callback) {
  if (typeof callback === "function") {
    if (!el._x_cleanups)
      el._x_cleanups = [];
    el._x_cleanups.push(callback);
  } else {
    callback = el;
    onElRemoveds.push(callback);
  }
}
function onAttributesAdded(callback) {
  onAttributeAddeds.push(callback);
}
function onAttributeRemoved(el, name, callback) {
  if (!el._x_attributeCleanups)
    el._x_attributeCleanups = {};
  if (!el._x_attributeCleanups[name])
    el._x_attributeCleanups[name] = [];
  el._x_attributeCleanups[name].push(callback);
}
function cleanupAttributes(el, names) {
  if (!el._x_attributeCleanups)
    return;
  Object.entries(el._x_attributeCleanups).forEach(([name, value]) => {
    if (names === void 0 || names.includes(name)) {
      value.forEach((i) => i());
      delete el._x_attributeCleanups[name];
    }
  });
}
function cleanupElement(el) {
  el._x_effects?.forEach(dequeueJob);
  while (el._x_cleanups?.length)
    el._x_cleanups.pop()();
}
var observer = new MutationObserver(onMutate);
var currentlyObserving = false;
function startObservingMutations() {
  observer.observe(document, { subtree: true, childList: true, attributes: true, attributeOldValue: true });
  currentlyObserving = true;
}
function stopObservingMutations() {
  flushObserver();
  observer.disconnect();
  currentlyObserving = false;
}
var queuedMutations = [];
function flushObserver() {
  let records = observer.takeRecords();
  queuedMutations.push(() => records.length > 0 && onMutate(records));
  let queueLengthWhenTriggered = queuedMutations.length;
  queueMicrotask(() => {
    if (queuedMutations.length === queueLengthWhenTriggered) {
      while (queuedMutations.length > 0)
        queuedMutations.shift()();
    }
  });
}
function mutateDom(callback) {
  if (!currentlyObserving)
    return callback();
  stopObservingMutations();
  let result = callback();
  startObservingMutations();
  return result;
}
var isCollecting = false;
var deferredMutations = [];
function deferMutations() {
  isCollecting = true;
}
function flushAndStopDeferringMutations() {
  isCollecting = false;
  onMutate(deferredMutations);
  deferredMutations = [];
}
function onMutate(mutations) {
  if (isCollecting) {
    deferredMutations = deferredMutations.concat(mutations);
    return;
  }
  let addedNodes = [];
  let removedNodes = /* @__PURE__ */ new Set();
  let addedAttributes = /* @__PURE__ */ new Map();
  let removedAttributes = /* @__PURE__ */ new Map();
  for (let i = 0; i < mutations.length; i++) {
    if (mutations[i].target._x_ignoreMutationObserver)
      continue;
    if (mutations[i].type === "childList") {
      mutations[i].removedNodes.forEach((node) => {
        if (node.nodeType !== 1)
          return;
        if (!node._x_marker)
          return;
        removedNodes.add(node);
      });
      mutations[i].addedNodes.forEach((node) => {
        if (node.nodeType !== 1)
          return;
        if (removedNodes.has(node)) {
          removedNodes.delete(node);
          return;
        }
        if (node._x_marker)
          return;
        addedNodes.push(node);
      });
    }
    if (mutations[i].type === "attributes") {
      let el = mutations[i].target;
      let name = mutations[i].attributeName;
      let oldValue = mutations[i].oldValue;
      let add2 = () => {
        if (!addedAttributes.has(el))
          addedAttributes.set(el, []);
        addedAttributes.get(el).push({ name, value: el.getAttribute(name) });
      };
      let remove = () => {
        if (!removedAttributes.has(el))
          removedAttributes.set(el, []);
        removedAttributes.get(el).push(name);
      };
      if (el.hasAttribute(name) && oldValue === null) {
        add2();
      } else if (el.hasAttribute(name)) {
        remove();
        add2();
      } else {
        remove();
      }
    }
  }
  removedAttributes.forEach((attrs, el) => {
    cleanupAttributes(el, attrs);
  });
  addedAttributes.forEach((attrs, el) => {
    onAttributeAddeds.forEach((i) => i(el, attrs));
  });
  for (let node of removedNodes) {
    if (addedNodes.some((i) => i.contains(node)))
      continue;
    onElRemoveds.forEach((i) => i(node));
  }
  for (let node of addedNodes) {
    if (!node.isConnected)
      continue;
    onElAddeds.forEach((i) => i(node));
  }
  addedNodes = null;
  removedNodes = null;
  addedAttributes = null;
  removedAttributes = null;
}
function scope(node) {
  return mergeProxies(closestDataStack(node));
}
function addScopeToNode(node, data2, referenceNode) {
  node._x_dataStack = [data2, ...closestDataStack(referenceNode || node)];
  return () => {
    node._x_dataStack = node._x_dataStack.filter((i) => i !== data2);
  };
}
function closestDataStack(node) {
  if (node._x_dataStack)
    return node._x_dataStack;
  if (typeof ShadowRoot === "function" && node instanceof ShadowRoot) {
    return closestDataStack(node.host);
  }
  if (!node.parentNode) {
    return [];
  }
  return closestDataStack(node.parentNode);
}
function mergeProxies(objects) {
  return new Proxy({ objects }, mergeProxyTrap);
}
function keyInPrototypeChain(obj, key) {
  if (obj === null || obj === Object.prototype)
    return null;
  if (Object.prototype.hasOwnProperty.call(obj, key))
    return obj;
  return keyInPrototypeChain(Object.getPrototypeOf(obj), key);
}
var mergeProxyTrap = {
  ownKeys({ objects }) {
    return Array.from(
      new Set(objects.flatMap((i) => Object.keys(i)))
    );
  },
  has({ objects }, name) {
    if (name == Symbol.unscopables)
      return false;
    return objects.some(
      (obj) => Object.prototype.hasOwnProperty.call(obj, name) || Reflect.has(obj, name)
    );
  },
  get({ objects }, name, thisProxy) {
    if (name == "toJSON")
      return collapseProxies;
    return Reflect.get(
      objects.find(
        (obj) => Reflect.has(obj, name)
      ) || {},
      name,
      thisProxy
    );
  },
  set({ objects }, name, value, thisProxy) {
    let target;
    for (const obj of objects) {
      target = keyInPrototypeChain(obj, name);
      if (target)
        break;
    }
    if (!target)
      target = objects[objects.length - 1];
    const descriptor = Object.getOwnPropertyDescriptor(target, name);
    if (descriptor?.set && descriptor?.get)
      return descriptor.set.call(thisProxy, value) || true;
    return Reflect.set(target, name, value);
  }
};
function collapseProxies() {
  let keys = Reflect.ownKeys(this);
  return keys.reduce((acc, key) => {
    acc[key] = Reflect.get(this, key);
    return acc;
  }, {});
}
function initInterceptors(data2) {
  let isObject3 = (val) => typeof val === "object" && !Array.isArray(val) && val !== null;
  let recurse = (obj, basePath = "") => {
    Object.entries(Object.getOwnPropertyDescriptors(obj)).forEach(([key, { value, enumerable }]) => {
      if (enumerable === false || value === void 0)
        return;
      if (typeof value === "object" && value !== null && value.__v_skip)
        return;
      let path = basePath === "" ? key : `${basePath}.${key}`;
      if (typeof value === "object" && value !== null && value._x_interceptor) {
        obj[key] = value.initialize(data2, path, key);
      } else {
        if (isObject3(value) && value !== obj && !(value instanceof Element)) {
          recurse(value, path);
        }
      }
    });
  };
  return recurse(data2);
}
function interceptor(callback, mutateObj = () => {
}) {
  let obj = {
    initialValue: void 0,
    _x_interceptor: true,
    initialize(data2, path, key) {
      return callback(this.initialValue, () => get(data2, path), (value) => set(data2, path, value), path, key);
    }
  };
  mutateObj(obj);
  return (initialValue) => {
    if (typeof initialValue === "object" && initialValue !== null && initialValue._x_interceptor) {
      let initialize = obj.initialize.bind(obj);
      obj.initialize = (data2, path, key) => {
        let innerValue = initialValue.initialize(data2, path, key);
        obj.initialValue = innerValue;
        return initialize(data2, path, key);
      };
    } else {
      obj.initialValue = initialValue;
    }
    return obj;
  };
}
function get(obj, path) {
  return path.split(".").reduce((carry, segment) => carry[segment], obj);
}
function set(obj, path, value) {
  if (typeof path === "string")
    path = path.split(".");
  if (path.length === 1)
    obj[path[0]] = value;
  else if (path.length === 0)
    throw error;
  else {
    if (obj[path[0]])
      return set(obj[path[0]], path.slice(1), value);
    else {
      obj[path[0]] = {};
      return set(obj[path[0]], path.slice(1), value);
    }
  }
}
var magics = {};
function magic(name, callback) {
  magics[name] = callback;
}
function injectMagics(obj, el) {
  let memoizedUtilities = getUtilities(el);
  Object.entries(magics).forEach(([name, callback]) => {
    Object.defineProperty(obj, `$${name}`, {
      get() {
        return callback(el, memoizedUtilities);
      },
      enumerable: false
    });
  });
  return obj;
}
function getUtilities(el) {
  let [utilities, cleanup2] = getElementBoundUtilities(el);
  let utils = { interceptor, ...utilities };
  onElRemoved(el, cleanup2);
  return utils;
}
function tryCatch(el, expression, callback, ...args) {
  try {
    return callback(...args);
  } catch (e) {
    handleError(e, el, expression);
  }
}
function handleError(...args) {
  return errorHandler(...args);
}
var errorHandler = normalErrorHandler;
function setErrorHandler(handler4) {
  errorHandler = handler4;
}
function normalErrorHandler(error2, el, expression = void 0) {
  error2 = Object.assign(
    error2 ?? { message: "No error message given." },
    { el, expression }
  );
  console.warn(`Alpine Expression Error: ${error2.message}

${expression ? 'Expression: "' + expression + '"\n\n' : ""}`, el);
  setTimeout(() => {
    throw error2;
  }, 0);
}
var shouldAutoEvaluateFunctions = true;
function dontAutoEvaluateFunctions(callback) {
  let cache = shouldAutoEvaluateFunctions;
  shouldAutoEvaluateFunctions = false;
  let result = callback();
  shouldAutoEvaluateFunctions = cache;
  return result;
}
function evaluate(el, expression, extras = {}) {
  let result;
  evaluateLater(el, expression)((value) => result = value, extras);
  return result;
}
function evaluateLater(...args) {
  return theEvaluatorFunction(...args);
}
var theEvaluatorFunction = () => {
};
function setEvaluator(newEvaluator) {
  theEvaluatorFunction = newEvaluator;
}
var theRawEvaluatorFunction;
function setRawEvaluator(newEvaluator) {
  theRawEvaluatorFunction = newEvaluator;
}
function normalEvaluator(el, expression) {
  let overriddenMagics = {};
  injectMagics(overriddenMagics, el);
  let dataStack = [overriddenMagics, ...closestDataStack(el)];
  let evaluator = typeof expression === "function" ? generateEvaluatorFromFunction(dataStack, expression) : generateEvaluatorFromString(dataStack, expression, el);
  return tryCatch.bind(null, el, expression, evaluator);
}
function generateEvaluatorFromFunction(dataStack, func) {
  return (receiver = () => {
  }, { scope: scope2 = {}, params = [], context } = {}) => {
    if (!shouldAutoEvaluateFunctions) {
      runIfTypeOfFunction(receiver, func, mergeProxies([scope2, ...dataStack]), params);
      return;
    }
    let result = func.apply(mergeProxies([scope2, ...dataStack]), params);
    runIfTypeOfFunction(receiver, result);
  };
}
var evaluatorMemo = {};
function generateFunctionFromString(expression, el) {
  if (evaluatorMemo[expression]) {
    return evaluatorMemo[expression];
  }
  let AsyncFunction = Object.getPrototypeOf(async function() {
  }).constructor;
  let rightSideSafeExpression = /^[\n\s]*if.*\(.*\)/.test(expression.trim()) || /^(let|const)\s/.test(expression.trim()) ? `(async()=>{ ${expression} })()` : expression;
  const safeAsyncFunction = () => {
    try {
      let func2 = new AsyncFunction(
        ["__self", "scope"],
        `with (scope) { __self.result = ${rightSideSafeExpression} }; __self.finished = true; return __self.result;`
      );
      Object.defineProperty(func2, "name", {
        value: `[Alpine] ${expression}`
      });
      return func2;
    } catch (error2) {
      handleError(error2, el, expression);
      return Promise.resolve();
    }
  };
  let func = safeAsyncFunction();
  evaluatorMemo[expression] = func;
  return func;
}
function generateEvaluatorFromString(dataStack, expression, el) {
  let func = generateFunctionFromString(expression, el);
  return (receiver = () => {
  }, { scope: scope2 = {}, params = [], context } = {}) => {
    func.result = void 0;
    func.finished = false;
    let completeScope = mergeProxies([scope2, ...dataStack]);
    if (typeof func === "function") {
      let promise = func.call(context, func, completeScope).catch((error2) => handleError(error2, el, expression));
      if (func.finished) {
        runIfTypeOfFunction(receiver, func.result, completeScope, params, el);
        func.result = void 0;
      } else {
        promise.then((result) => {
          runIfTypeOfFunction(receiver, result, completeScope, params, el);
        }).catch((error2) => handleError(error2, el, expression)).finally(() => func.result = void 0);
      }
    }
  };
}
function runIfTypeOfFunction(receiver, value, scope2, params, el) {
  if (shouldAutoEvaluateFunctions && typeof value === "function") {
    let result = value.apply(scope2, params);
    if (result instanceof Promise) {
      result.then((i) => runIfTypeOfFunction(receiver, i, scope2, params)).catch((error2) => handleError(error2, el, value));
    } else {
      receiver(result);
    }
  } else if (typeof value === "object" && value instanceof Promise) {
    value.then((i) => receiver(i));
  } else {
    receiver(value);
  }
}
function evaluateRaw(...args) {
  return theRawEvaluatorFunction(...args);
}
function normalRawEvaluator(el, expression, extras = {}) {
  let overriddenMagics = {};
  injectMagics(overriddenMagics, el);
  let dataStack = [overriddenMagics, ...closestDataStack(el)];
  let scope2 = mergeProxies([extras.scope ?? {}, ...dataStack]);
  let params = extras.params ?? [];
  if (expression.includes("await")) {
    let AsyncFunction = Object.getPrototypeOf(async function() {
    }).constructor;
    let rightSideSafeExpression = /^[\n\s]*if.*\(.*\)/.test(expression.trim()) || /^(let|const)\s/.test(expression.trim()) ? `(async()=>{ ${expression} })()` : expression;
    let func = new AsyncFunction(
      ["scope"],
      `with (scope) { let __result = ${rightSideSafeExpression}; return __result }`
    );
    let result = func.call(extras.context, scope2);
    return result;
  } else {
    let rightSideSafeExpression = /^[\n\s]*if.*\(.*\)/.test(expression.trim()) || /^(let|const)\s/.test(expression.trim()) ? `(()=>{ ${expression} })()` : expression;
    let func = new Function(
      ["scope"],
      `with (scope) { let __result = ${rightSideSafeExpression}; return __result }`
    );
    let result = func.call(extras.context, scope2);
    if (typeof result === "function" && shouldAutoEvaluateFunctions) {
      return result.apply(scope2, params);
    }
    return result;
  }
}
var prefixAsString = "x-";
function prefix(subject = "") {
  return prefixAsString + subject;
}
function setPrefix(newPrefix) {
  prefixAsString = newPrefix;
}
var directiveHandlers = {};
function directive(name, callback) {
  directiveHandlers[name] = callback;
  return {
    before(directive2) {
      if (!directiveHandlers[directive2]) {
        console.warn(String.raw`Cannot find directive \`${directive2}\`. \`${name}\` will use the default order of execution`);
        return;
      }
      const pos = directiveOrder.indexOf(directive2);
      directiveOrder.splice(pos >= 0 ? pos : directiveOrder.indexOf("DEFAULT"), 0, name);
    }
  };
}
function directiveExists(name) {
  return Object.keys(directiveHandlers).includes(name);
}
function directives(el, attributes, originalAttributeOverride) {
  attributes = Array.from(attributes);
  if (el._x_virtualDirectives) {
    let vAttributes = Object.entries(el._x_virtualDirectives).map(([name, value]) => ({ name, value }));
    let staticAttributes = attributesOnly(vAttributes);
    vAttributes = vAttributes.map((attribute) => {
      if (staticAttributes.find((attr) => attr.name === attribute.name)) {
        return {
          name: `x-bind:${attribute.name}`,
          value: `"${attribute.value}"`
        };
      }
      return attribute;
    });
    attributes = attributes.concat(vAttributes);
  }
  let transformedAttributeMap = {};
  let directives2 = attributes.map(toTransformedAttributes((newName, oldName) => transformedAttributeMap[newName] = oldName)).filter(outNonAlpineAttributes).map(toParsedDirectives(transformedAttributeMap, originalAttributeOverride)).sort(byPriority);
  return directives2.map((directive2) => {
    return getDirectiveHandler(el, directive2);
  });
}
function attributesOnly(attributes) {
  return Array.from(attributes).map(toTransformedAttributes()).filter((attr) => !outNonAlpineAttributes(attr));
}
var isDeferringHandlers = false;
var directiveHandlerStacks = /* @__PURE__ */ new Map();
var currentHandlerStackKey = Symbol();
function deferHandlingDirectives(callback) {
  isDeferringHandlers = true;
  let key = Symbol();
  currentHandlerStackKey = key;
  directiveHandlerStacks.set(key, []);
  let flushHandlers = () => {
    while (directiveHandlerStacks.get(key).length)
      directiveHandlerStacks.get(key).shift()();
    directiveHandlerStacks.delete(key);
  };
  let stopDeferring = () => {
    isDeferringHandlers = false;
    flushHandlers();
  };
  callback(flushHandlers);
  stopDeferring();
}
function getElementBoundUtilities(el) {
  let cleanups = [];
  let cleanup2 = (callback) => cleanups.push(callback);
  let [effect3, cleanupEffect] = elementBoundEffect(el);
  cleanups.push(cleanupEffect);
  let utilities = {
    Alpine: alpine_default,
    effect: effect3,
    cleanup: cleanup2,
    evaluateLater: evaluateLater.bind(evaluateLater, el),
    evaluate: evaluate.bind(evaluate, el)
  };
  let doCleanup = () => cleanups.forEach((i) => i());
  return [utilities, doCleanup];
}
function getDirectiveHandler(el, directive2) {
  let noop = () => {
  };
  let handler4 = directiveHandlers[directive2.type] || noop;
  let [utilities, cleanup2] = getElementBoundUtilities(el);
  onAttributeRemoved(el, directive2.original, cleanup2);
  let fullHandler = () => {
    if (el._x_ignore || el._x_ignoreSelf)
      return;
    handler4.inline && handler4.inline(el, directive2, utilities);
    handler4 = handler4.bind(handler4, el, directive2, utilities);
    isDeferringHandlers ? directiveHandlerStacks.get(currentHandlerStackKey).push(handler4) : handler4();
  };
  fullHandler.runCleanups = cleanup2;
  return fullHandler;
}
var startingWith = (subject, replacement) => ({ name, value }) => {
  if (name.startsWith(subject))
    name = name.replace(subject, replacement);
  return { name, value };
};
var into = (i) => i;
function toTransformedAttributes(callback = () => {
}) {
  return ({ name, value }) => {
    let { name: newName, value: newValue } = attributeTransformers.reduce((carry, transform) => {
      return transform(carry);
    }, { name, value });
    if (newName !== name)
      callback(newName, name);
    return { name: newName, value: newValue };
  };
}
var attributeTransformers = [];
function mapAttributes(callback) {
  attributeTransformers.push(callback);
}
function outNonAlpineAttributes({ name }) {
  return alpineAttributeRegex().test(name);
}
var alpineAttributeRegex = () => new RegExp(`^${prefixAsString}([^:^.]+)\\b`);
function toParsedDirectives(transformedAttributeMap, originalAttributeOverride) {
  return ({ name, value }) => {
    if (name === value)
      value = "";
    let typeMatch = name.match(alpineAttributeRegex());
    let valueMatch = name.match(/:([a-zA-Z0-9\-_:]+)/);
    let modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];
    let original = originalAttributeOverride || transformedAttributeMap[name] || name;
    return {
      type: typeMatch ? typeMatch[1] : null,
      value: valueMatch ? valueMatch[1] : null,
      modifiers: modifiers.map((i) => i.replace(".", "")),
      expression: value,
      original
    };
  };
}
var DEFAULT = "DEFAULT";
var directiveOrder = [
  "ignore",
  "ref",
  "id",
  "data",
  "anchor",
  "bind",
  "init",
  "for",
  "model",
  "modelable",
  "transition",
  "show",
  "if",
  DEFAULT,
  "teleport"
];
function byPriority(a, b) {
  let typeA = directiveOrder.indexOf(a.type) === -1 ? DEFAULT : a.type;
  let typeB = directiveOrder.indexOf(b.type) === -1 ? DEFAULT : b.type;
  return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB);
}
function dispatch(el, name, detail = {}, options = {}) {
  return el.dispatchEvent(
    new CustomEvent(name, {
      detail,
      bubbles: true,
      // Allows events to pass the shadow DOM barrier.
      composed: true,
      cancelable: true,
      // Allows overriding the default event options.
      ...options
    })
  );
}
function walk(el, callback) {
  if (typeof ShadowRoot === "function" && el instanceof ShadowRoot) {
    Array.from(el.children).forEach((el2) => walk(el2, callback));
    return;
  }
  let skip = false;
  callback(el, () => skip = true);
  if (skip)
    return;
  let node = el.firstElementChild;
  while (node) {
    walk(node, callback, false);
    node = node.nextElementSibling;
  }
}
function warn(message, ...args) {
  console.warn(`Alpine Warning: ${message}`, ...args);
}
var started = false;
function start() {
  if (started)
    warn("Alpine has already been initialized on this page. Calling Alpine.start() more than once can cause problems.");
  started = true;
  if (!document.body)
    warn("Unable to initialize. Trying to load Alpine before `<body>` is available. Did you forget to add `defer` in Alpine's `<script>` tag?");
  dispatch(document, "alpine:init");
  dispatch(document, "alpine:initializing");
  startObservingMutations();
  onElAdded((el) => initTree(el, walk));
  onElRemoved((el) => destroyTree(el));
  onAttributesAdded((el, attrs) => {
    directives(el, attrs).forEach((handle) => handle());
  });
  let outNestedComponents = (el) => !closestRoot(el.parentElement, true);
  Array.from(document.querySelectorAll(allSelectors().join(","))).filter(outNestedComponents).forEach((el) => {
    initTree(el);
  });
  dispatch(document, "alpine:initialized");
  setTimeout(() => {
    warnAboutMissingPlugins();
  });
}
var rootSelectorCallbacks = [];
var initSelectorCallbacks = [];
function rootSelectors() {
  return rootSelectorCallbacks.map((fn) => fn());
}
function allSelectors() {
  return rootSelectorCallbacks.concat(initSelectorCallbacks).map((fn) => fn());
}
function addRootSelector(selectorCallback) {
  rootSelectorCallbacks.push(selectorCallback);
}
function addInitSelector(selectorCallback) {
  initSelectorCallbacks.push(selectorCallback);
}
function closestRoot(el, includeInitSelectors = false) {
  return findClosest(el, (element) => {
    const selectors = includeInitSelectors ? allSelectors() : rootSelectors();
    if (selectors.some((selector) => element.matches(selector)))
      return true;
  });
}
function findClosest(el, callback) {
  if (!el)
    return;
  if (callback(el))
    return el;
  if (el._x_teleportBack)
    return findClosest(el._x_teleportBack, callback);
  if (el.parentNode instanceof ShadowRoot) {
    return findClosest(el.parentNode.host, callback);
  }
  if (!el.parentElement)
    return;
  return findClosest(el.parentElement, callback);
}
function isRoot(el) {
  return rootSelectors().some((selector) => el.matches(selector));
}
var initInterceptors2 = [];
function interceptInit(callback) {
  initInterceptors2.push(callback);
}
var markerDispenser = 1;
function initTree(el, walker = walk, intercept = () => {
}) {
  if (findClosest(el, (i) => i._x_ignore))
    return;
  deferHandlingDirectives(() => {
    walker(el, (el2, skip) => {
      if (el2._x_marker)
        return;
      intercept(el2, skip);
      initInterceptors2.forEach((i) => i(el2, skip));
      directives(el2, el2.attributes).forEach((handle) => handle());
      if (!el2._x_ignore)
        el2._x_marker = markerDispenser++;
      el2._x_ignore && skip();
    });
  });
}
function destroyTree(root, walker = walk) {
  walker(root, (el) => {
    cleanupElement(el);
    cleanupAttributes(el);
    delete el._x_marker;
  });
}
function warnAboutMissingPlugins() {
  let pluginDirectives = [
    ["ui", "dialog", ["[x-dialog], [x-popover]"]],
    ["anchor", "anchor", ["[x-anchor]"]],
    ["sort", "sort", ["[x-sort]"]]
  ];
  pluginDirectives.forEach(([plugin2, directive2, selectors]) => {
    if (directiveExists(directive2))
      return;
    selectors.some((selector) => {
      if (document.querySelector(selector)) {
        warn(`found "${selector}", but missing ${plugin2} plugin`);
        return true;
      }
    });
  });
}
var tickStack = [];
var isHolding = false;
function nextTick(callback = () => {
}) {
  queueMicrotask(() => {
    isHolding || setTimeout(() => {
      releaseNextTicks();
    });
  });
  return new Promise((res) => {
    tickStack.push(() => {
      callback();
      res();
    });
  });
}
function releaseNextTicks() {
  isHolding = false;
  while (tickStack.length)
    tickStack.shift()();
}
function holdNextTicks() {
  isHolding = true;
}
function setClasses(el, value) {
  if (Array.isArray(value)) {
    return setClassesFromString(el, value.join(" "));
  } else if (typeof value === "object" && value !== null) {
    return setClassesFromObject(el, value);
  } else if (typeof value === "function") {
    return setClasses(el, value());
  }
  return setClassesFromString(el, value);
}
function splitClasses(classString) {
  return classString.split(/\s/).filter(Boolean);
}
function setClassesFromString(el, classString) {
  let missingClasses = (classString2) => splitClasses(classString2).filter((i) => !el.classList.contains(i)).filter(Boolean);
  let addClassesAndReturnUndo = (classes) => {
    el.classList.add(...classes);
    return () => {
      el.classList.remove(...classes);
    };
  };
  classString = classString === true ? classString = "" : classString || "";
  return addClassesAndReturnUndo(missingClasses(classString));
}
function setClassesFromObject(el, classObject) {
  let forAdd = Object.entries(classObject).flatMap(([classString, bool]) => bool ? splitClasses(classString) : false).filter(Boolean);
  let forRemove = Object.entries(classObject).flatMap(([classString, bool]) => !bool ? splitClasses(classString) : false).filter(Boolean);
  let added = [];
  let removed = [];
  forRemove.forEach((i) => {
    if (el.classList.contains(i)) {
      el.classList.remove(i);
      removed.push(i);
    }
  });
  forAdd.forEach((i) => {
    if (!el.classList.contains(i)) {
      el.classList.add(i);
      added.push(i);
    }
  });
  return () => {
    removed.forEach((i) => el.classList.add(i));
    added.forEach((i) => el.classList.remove(i));
  };
}
function setStyles(el, value) {
  if (typeof value === "object" && value !== null) {
    return setStylesFromObject(el, value);
  }
  return setStylesFromString(el, value);
}
function setStylesFromObject(el, value) {
  let previousStyles = {};
  Object.entries(value).forEach(([key, value2]) => {
    previousStyles[key] = el.style[key];
    if (!key.startsWith("--")) {
      key = kebabCase(key);
    }
    el.style.setProperty(key, value2);
  });
  setTimeout(() => {
    if (el.style.length === 0) {
      el.removeAttribute("style");
    }
  });
  return () => {
    setStyles(el, previousStyles);
  };
}
function setStylesFromString(el, value) {
  let cache = el.getAttribute("style", value);
  el.setAttribute("style", value);
  return () => {
    el.setAttribute("style", cache || "");
  };
}
function kebabCase(subject) {
  return subject.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
function once(callback, fallback = () => {
}) {
  let called = false;
  return function() {
    if (!called) {
      called = true;
      callback.apply(this, arguments);
    } else {
      fallback.apply(this, arguments);
    }
  };
}
directive("transition", (el, { value, modifiers, expression }, { evaluate: evaluate2 }) => {
  if (typeof expression === "function")
    expression = evaluate2(expression);
  if (expression === false)
    return;
  if (!expression || typeof expression === "boolean") {
    registerTransitionsFromHelper(el, modifiers, value);
  } else {
    registerTransitionsFromClassString(el, expression, value);
  }
});
function registerTransitionsFromClassString(el, classString, stage) {
  registerTransitionObject(el, setClasses, "");
  let directiveStorageMap = {
    "enter": (classes) => {
      el._x_transition.enter.during = classes;
    },
    "enter-start": (classes) => {
      el._x_transition.enter.start = classes;
    },
    "enter-end": (classes) => {
      el._x_transition.enter.end = classes;
    },
    "leave": (classes) => {
      el._x_transition.leave.during = classes;
    },
    "leave-start": (classes) => {
      el._x_transition.leave.start = classes;
    },
    "leave-end": (classes) => {
      el._x_transition.leave.end = classes;
    }
  };
  directiveStorageMap[stage](classString);
}
function registerTransitionsFromHelper(el, modifiers, stage) {
  registerTransitionObject(el, setStyles);
  let doesntSpecify = !modifiers.includes("in") && !modifiers.includes("out") && !stage;
  let transitioningIn = doesntSpecify || modifiers.includes("in") || ["enter"].includes(stage);
  let transitioningOut = doesntSpecify || modifiers.includes("out") || ["leave"].includes(stage);
  if (modifiers.includes("in") && !doesntSpecify) {
    modifiers = modifiers.filter((i, index) => index < modifiers.indexOf("out"));
  }
  if (modifiers.includes("out") && !doesntSpecify) {
    modifiers = modifiers.filter((i, index) => index > modifiers.indexOf("out"));
  }
  let wantsAll = !modifiers.includes("opacity") && !modifiers.includes("scale");
  let wantsOpacity = wantsAll || modifiers.includes("opacity");
  let wantsScale = wantsAll || modifiers.includes("scale");
  let opacityValue = wantsOpacity ? 0 : 1;
  let scaleValue = wantsScale ? modifierValue(modifiers, "scale", 95) / 100 : 1;
  let delay = modifierValue(modifiers, "delay", 0) / 1e3;
  let origin = modifierValue(modifiers, "origin", "center");
  let property = "opacity, transform";
  let durationIn = modifierValue(modifiers, "duration", 150) / 1e3;
  let durationOut = modifierValue(modifiers, "duration", 75) / 1e3;
  let easing = `cubic-bezier(0.4, 0.0, 0.2, 1)`;
  if (transitioningIn) {
    el._x_transition.enter.during = {
      transformOrigin: origin,
      transitionDelay: `${delay}s`,
      transitionProperty: property,
      transitionDuration: `${durationIn}s`,
      transitionTimingFunction: easing
    };
    el._x_transition.enter.start = {
      opacity: opacityValue,
      transform: `scale(${scaleValue})`
    };
    el._x_transition.enter.end = {
      opacity: 1,
      transform: `scale(1)`
    };
  }
  if (transitioningOut) {
    el._x_transition.leave.during = {
      transformOrigin: origin,
      transitionDelay: `${delay}s`,
      transitionProperty: property,
      transitionDuration: `${durationOut}s`,
      transitionTimingFunction: easing
    };
    el._x_transition.leave.start = {
      opacity: 1,
      transform: `scale(1)`
    };
    el._x_transition.leave.end = {
      opacity: opacityValue,
      transform: `scale(${scaleValue})`
    };
  }
}
function registerTransitionObject(el, setFunction, defaultValue = {}) {
  if (!el._x_transition)
    el._x_transition = {
      enter: { during: defaultValue, start: defaultValue, end: defaultValue },
      leave: { during: defaultValue, start: defaultValue, end: defaultValue },
      in(before = () => {
      }, after = () => {
      }) {
        transition(el, setFunction, {
          during: this.enter.during,
          start: this.enter.start,
          end: this.enter.end
        }, before, after);
      },
      out(before = () => {
      }, after = () => {
      }) {
        transition(el, setFunction, {
          during: this.leave.during,
          start: this.leave.start,
          end: this.leave.end
        }, before, after);
      }
    };
}
window.Element.prototype._x_toggleAndCascadeWithTransitions = function(el, value, show, hide) {
  const nextTick2 = document.visibilityState === "visible" ? requestAnimationFrame : setTimeout;
  let clickAwayCompatibleShow = () => nextTick2(show);
  if (value) {
    if (el._x_transition && (el._x_transition.enter || el._x_transition.leave)) {
      el._x_transition.enter && (Object.entries(el._x_transition.enter.during).length || Object.entries(el._x_transition.enter.start).length || Object.entries(el._x_transition.enter.end).length) ? el._x_transition.in(show) : clickAwayCompatibleShow();
    } else {
      el._x_transition ? el._x_transition.in(show) : clickAwayCompatibleShow();
    }
    return;
  }
  el._x_hidePromise = el._x_transition ? new Promise((resolve, reject) => {
    el._x_transition.out(() => {
    }, () => resolve(hide));
    el._x_transitioning && el._x_transitioning.beforeCancel(() => reject({ isFromCancelledTransition: true }));
  }) : Promise.resolve(hide);
  queueMicrotask(() => {
    let closest = closestHide(el);
    if (closest) {
      if (!closest._x_hideChildren)
        closest._x_hideChildren = [];
      closest._x_hideChildren.push(el);
    } else {
      nextTick2(() => {
        let hideAfterChildren = (el2) => {
          let carry = Promise.all([
            el2._x_hidePromise,
            ...(el2._x_hideChildren || []).map(hideAfterChildren)
          ]).then(([i]) => i?.());
          delete el2._x_hidePromise;
          delete el2._x_hideChildren;
          return carry;
        };
        hideAfterChildren(el).catch((e) => {
          if (!e.isFromCancelledTransition)
            throw e;
        });
      });
    }
  });
};
function closestHide(el) {
  let parent = el.parentNode;
  if (!parent)
    return;
  return parent._x_hidePromise ? parent : closestHide(parent);
}
function transition(el, setFunction, { during, start: start2, end } = {}, before = () => {
}, after = () => {
}) {
  if (el._x_transitioning)
    el._x_transitioning.cancel();
  if (Object.keys(during).length === 0 && Object.keys(start2).length === 0 && Object.keys(end).length === 0) {
    before();
    after();
    return;
  }
  let undoStart, undoDuring, undoEnd;
  performTransition(el, {
    start() {
      undoStart = setFunction(el, start2);
    },
    during() {
      undoDuring = setFunction(el, during);
    },
    before,
    end() {
      undoStart();
      undoEnd = setFunction(el, end);
    },
    after,
    cleanup() {
      undoDuring();
      undoEnd();
    }
  });
}
function performTransition(el, stages) {
  let interrupted, reachedBefore, reachedEnd;
  let finish = once(() => {
    mutateDom(() => {
      interrupted = true;
      if (!reachedBefore)
        stages.before();
      if (!reachedEnd) {
        stages.end();
        releaseNextTicks();
      }
      stages.after();
      if (el.isConnected)
        stages.cleanup();
      delete el._x_transitioning;
    });
  });
  el._x_transitioning = {
    beforeCancels: [],
    beforeCancel(callback) {
      this.beforeCancels.push(callback);
    },
    cancel: once(function() {
      while (this.beforeCancels.length) {
        this.beforeCancels.shift()();
      }
      ;
      finish();
    }),
    finish
  };
  mutateDom(() => {
    stages.start();
    stages.during();
  });
  holdNextTicks();
  requestAnimationFrame(() => {
    if (interrupted)
      return;
    let duration = Number(getComputedStyle(el).transitionDuration.replace(/,.*/, "").replace("s", "")) * 1e3;
    let delay = Number(getComputedStyle(el).transitionDelay.replace(/,.*/, "").replace("s", "")) * 1e3;
    if (duration === 0)
      duration = Number(getComputedStyle(el).animationDuration.replace("s", "")) * 1e3;
    mutateDom(() => {
      stages.before();
    });
    reachedBefore = true;
    requestAnimationFrame(() => {
      if (interrupted)
        return;
      mutateDom(() => {
        stages.end();
      });
      releaseNextTicks();
      setTimeout(el._x_transitioning.finish, duration + delay);
      reachedEnd = true;
    });
  });
}
function modifierValue(modifiers, key, fallback) {
  if (modifiers.indexOf(key) === -1)
    return fallback;
  const rawValue = modifiers[modifiers.indexOf(key) + 1];
  if (!rawValue)
    return fallback;
  if (key === "scale") {
    if (isNaN(rawValue))
      return fallback;
  }
  if (key === "duration" || key === "delay") {
    let match = rawValue.match(/([0-9]+)ms/);
    if (match)
      return match[1];
  }
  if (key === "origin") {
    if (["top", "right", "left", "center", "bottom"].includes(modifiers[modifiers.indexOf(key) + 2])) {
      return [rawValue, modifiers[modifiers.indexOf(key) + 2]].join(" ");
    }
  }
  return rawValue;
}
var isCloning = false;
function skipDuringClone(callback, fallback = () => {
}) {
  return (...args) => isCloning ? fallback(...args) : callback(...args);
}
function onlyDuringClone(callback) {
  return (...args) => isCloning && callback(...args);
}
var interceptors = [];
function interceptClone(callback) {
  interceptors.push(callback);
}
function cloneNode(from, to) {
  interceptors.forEach((i) => i(from, to));
  isCloning = true;
  dontRegisterReactiveSideEffects(() => {
    initTree(to, (el, callback) => {
      callback(el, () => {
      });
    });
  });
  isCloning = false;
}
var isCloningLegacy = false;
function clone(oldEl, newEl) {
  if (!newEl._x_dataStack)
    newEl._x_dataStack = oldEl._x_dataStack;
  isCloning = true;
  isCloningLegacy = true;
  dontRegisterReactiveSideEffects(() => {
    cloneTree(newEl);
  });
  isCloning = false;
  isCloningLegacy = false;
}
function cloneTree(el) {
  let hasRunThroughFirstEl = false;
  let shallowWalker = (el2, callback) => {
    walk(el2, (el3, skip) => {
      if (hasRunThroughFirstEl && isRoot(el3))
        return skip();
      hasRunThroughFirstEl = true;
      callback(el3, skip);
    });
  };
  initTree(el, shallowWalker);
}
function dontRegisterReactiveSideEffects(callback) {
  let cache = effect;
  overrideEffect((callback2, el) => {
    let storedEffect = cache(callback2);
    release(storedEffect);
    return () => {
    };
  });
  callback();
  overrideEffect(cache);
}
function bind(el, name, value, modifiers = []) {
  if (!el._x_bindings)
    el._x_bindings = reactive({});
  el._x_bindings[name] = value;
  name = modifiers.includes("camel") ? camelCase(name) : name;
  switch (name) {
    case "value":
      bindInputValue(el, value);
      break;
    case "style":
      bindStyles(el, value);
      break;
    case "class":
      bindClasses(el, value);
      break;
    case "selected":
    case "checked":
      bindAttributeAndProperty(el, name, value);
      break;
    default:
      bindAttribute(el, name, value);
      break;
  }
}
function bindInputValue(el, value) {
  if (isRadio(el)) {
    if (el.attributes.value === void 0) {
      el.value = value;
    }
  } else if (isCheckbox(el)) {
    if (Number.isInteger(value)) {
      el.value = value;
    } else if (!Array.isArray(value) && typeof value !== "boolean" && ![null, void 0].includes(value)) {
      el.value = String(value);
    } else {
      if (Array.isArray(value)) {
        el.checked = value.some((val) => checkedAttrLooseCompare(val, el.value));
      } else {
        el.checked = !!value;
      }
    }
  } else if (el.tagName === "SELECT") {
    updateSelect(el, value);
  } else {
    if (el.value === value)
      return;
    el.value = value === void 0 ? "" : value;
  }
}
function bindClasses(el, value) {
  if (el._x_undoAddedClasses)
    el._x_undoAddedClasses();
  el._x_undoAddedClasses = setClasses(el, value);
}
function bindStyles(el, value) {
  if (el._x_undoAddedStyles)
    el._x_undoAddedStyles();
  el._x_undoAddedStyles = setStyles(el, value);
}
function bindAttributeAndProperty(el, name, value) {
  bindAttribute(el, name, value);
  setPropertyIfChanged(el, name, value);
}
function bindAttribute(el, name, value) {
  if ([null, void 0, false].includes(value) && attributeShouldntBePreservedIfFalsy(name)) {
    el.removeAttribute(name);
  } else {
    if (isBooleanAttr(name))
      value = name;
    setIfChanged(el, name, value);
  }
}
function setIfChanged(el, attrName, value) {
  if (el.getAttribute(attrName) != value) {
    el.setAttribute(attrName, value);
  }
}
function setPropertyIfChanged(el, propName, value) {
  if (el[propName] !== value) {
    el[propName] = value;
  }
}
function updateSelect(el, value) {
  const arrayWrappedValue = [].concat(value).map((value2) => {
    return value2 + "";
  });
  Array.from(el.options).forEach((option) => {
    option.selected = arrayWrappedValue.includes(option.value);
  });
}
function camelCase(subject) {
  return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
}
function checkedAttrLooseCompare(valueA, valueB) {
  return valueA == valueB;
}
function safeParseBoolean(rawValue) {
  if ([1, "1", "true", "on", "yes", true].includes(rawValue)) {
    return true;
  }
  if ([0, "0", "false", "off", "no", false].includes(rawValue)) {
    return false;
  }
  return rawValue ? Boolean(rawValue) : null;
}
var booleanAttributes = /* @__PURE__ */ new Set([
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected",
  "shadowrootclonable",
  "shadowrootdelegatesfocus",
  "shadowrootserializable"
]);
function isBooleanAttr(attrName) {
  return booleanAttributes.has(attrName);
}
function attributeShouldntBePreservedIfFalsy(name) {
  return !["aria-pressed", "aria-checked", "aria-expanded", "aria-selected"].includes(name);
}
function getBinding(el, name, fallback) {
  if (el._x_bindings && el._x_bindings[name] !== void 0)
    return el._x_bindings[name];
  return getAttributeBinding(el, name, fallback);
}
function extractProp(el, name, fallback, extract = true) {
  if (el._x_bindings && el._x_bindings[name] !== void 0)
    return el._x_bindings[name];
  if (el._x_inlineBindings && el._x_inlineBindings[name] !== void 0) {
    let binding = el._x_inlineBindings[name];
    binding.extract = extract;
    return dontAutoEvaluateFunctions(() => {
      return evaluate(el, binding.expression);
    });
  }
  return getAttributeBinding(el, name, fallback);
}
function getAttributeBinding(el, name, fallback) {
  let attr = el.getAttribute(name);
  if (attr === null)
    return typeof fallback === "function" ? fallback() : fallback;
  if (attr === "")
    return true;
  if (isBooleanAttr(name)) {
    return !![name, "true"].includes(attr);
  }
  return attr;
}
function isCheckbox(el) {
  return el.type === "checkbox" || el.localName === "ui-checkbox" || el.localName === "ui-switch";
}
function isRadio(el) {
  return el.type === "radio" || el.localName === "ui-radio";
}
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this, args = arguments;
    const later = function() {
      timeout = null;
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
function throttle(func, limit) {
  let inThrottle;
  return function() {
    let context = this, args = arguments;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
function entangle({ get: outerGet, set: outerSet }, { get: innerGet, set: innerSet }) {
  let firstRun = true;
  let outerHash;
  let innerHash;
  let reference = effect(() => {
    let outer = outerGet();
    let inner = innerGet();
    if (firstRun) {
      innerSet(cloneIfObject(outer));
      firstRun = false;
    } else {
      let outerHashLatest = JSON.stringify(outer);
      let innerHashLatest = JSON.stringify(inner);
      if (outerHashLatest !== outerHash) {
        innerSet(cloneIfObject(outer));
      } else if (outerHashLatest !== innerHashLatest) {
        outerSet(cloneIfObject(inner));
      } else {
      }
    }
    outerHash = JSON.stringify(outerGet());
    innerHash = JSON.stringify(innerGet());
  });
  return () => {
    release(reference);
  };
}
function cloneIfObject(value) {
  return typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
}
function plugin(callback) {
  let callbacks = Array.isArray(callback) ? callback : [callback];
  callbacks.forEach((i) => i(alpine_default));
}
var stores = {};
var isReactive = false;
function store(name, value) {
  if (!isReactive) {
    stores = reactive(stores);
    isReactive = true;
  }
  if (value === void 0) {
    return stores[name];
  }
  stores[name] = value;
  initInterceptors(stores[name]);
  if (typeof value === "object" && value !== null && value.hasOwnProperty("init") && typeof value.init === "function") {
    stores[name].init();
  }
}
function getStores() {
  return stores;
}
var binds = {};
function bind2(name, bindings) {
  let getBindings = typeof bindings !== "function" ? () => bindings : bindings;
  if (name instanceof Element) {
    return applyBindingsObject(name, getBindings());
  } else {
    binds[name] = getBindings;
  }
  return () => {
  };
}
function injectBindingProviders(obj) {
  Object.entries(binds).forEach(([name, callback]) => {
    Object.defineProperty(obj, name, {
      get() {
        return (...args) => {
          return callback(...args);
        };
      }
    });
  });
  return obj;
}
function applyBindingsObject(el, obj, original) {
  let cleanupRunners = [];
  while (cleanupRunners.length)
    cleanupRunners.pop()();
  let attributes = Object.entries(obj).map(([name, value]) => ({ name, value }));
  let staticAttributes = attributesOnly(attributes);
  attributes = attributes.map((attribute) => {
    if (staticAttributes.find((attr) => attr.name === attribute.name)) {
      return {
        name: `x-bind:${attribute.name}`,
        value: `"${attribute.value}"`
      };
    }
    return attribute;
  });
  directives(el, attributes, original).map((handle) => {
    cleanupRunners.push(handle.runCleanups);
    handle();
  });
  return () => {
    while (cleanupRunners.length)
      cleanupRunners.pop()();
  };
}
var datas = {};
function data(name, callback) {
  datas[name] = callback;
}
function injectDataProviders(obj, context) {
  Object.entries(datas).forEach(([name, callback]) => {
    Object.defineProperty(obj, name, {
      get() {
        return (...args) => {
          return callback.bind(context)(...args);
        };
      },
      enumerable: false
    });
  });
  return obj;
}
var Alpine = {
  get reactive() {
    return reactive;
  },
  get release() {
    return release;
  },
  get effect() {
    return effect;
  },
  get raw() {
    return raw;
  },
  get transaction() {
    return transaction;
  },
  version: "3.15.12",
  flushAndStopDeferringMutations,
  dontAutoEvaluateFunctions,
  disableEffectScheduling,
  startObservingMutations,
  stopObservingMutations,
  setReactivityEngine,
  onAttributeRemoved,
  onAttributesAdded,
  closestDataStack,
  skipDuringClone,
  onlyDuringClone,
  addRootSelector,
  addInitSelector,
  setErrorHandler,
  interceptClone,
  addScopeToNode,
  deferMutations,
  mapAttributes,
  evaluateLater,
  interceptInit,
  initInterceptors,
  injectMagics,
  setEvaluator,
  setRawEvaluator,
  mergeProxies,
  extractProp,
  findClosest,
  onElRemoved,
  closestRoot,
  destroyTree,
  interceptor,
  // INTERNAL: not public API and is subject to change without major release.
  transition,
  // INTERNAL
  setStyles,
  // INTERNAL
  mutateDom,
  directive,
  entangle,
  throttle,
  debounce,
  evaluate,
  evaluateRaw,
  initTree,
  nextTick,
  prefixed: prefix,
  prefix: setPrefix,
  plugin,
  magic,
  store,
  start,
  clone,
  // INTERNAL
  cloneNode,
  // INTERNAL
  bound: getBinding,
  $data: scope,
  watch,
  walk,
  data,
  bind: bind2
};
var alpine_default = Alpine;
function makeMap(str, expectsLowerCase) {
  const map = /* @__PURE__ */ Object.create(null);
  const list = str.split(",");
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
}
var specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
var isBooleanAttr2 = /* @__PURE__ */ makeMap(specialBooleanAttrs + `,async,autofocus,autoplay,controls,default,defer,disabled,hidden,loop,open,required,reversed,scoped,seamless,checked,muted,multiple,selected`);
var EMPTY_OBJ = true ? Object.freeze({}) : {};
var EMPTY_ARR = true ? Object.freeze([]) : [];
var hasOwnProperty = Object.prototype.hasOwnProperty;
var hasOwn = (val, key) => hasOwnProperty.call(val, key);
var isArray = Array.isArray;
var isMap = (val) => toTypeString(val) === "[object Map]";
var isString = (val) => typeof val === "string";
var isSymbol = (val) => typeof val === "symbol";
var isObject = (val) => val !== null && typeof val === "object";
var objectToString = Object.prototype.toString;
var toTypeString = (value) => objectToString.call(value);
var toRawType = (value) => {
  return toTypeString(value).slice(8, -1);
};
var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
var cacheStringFunction = (fn) => {
  const cache = /* @__PURE__ */ Object.create(null);
  return (str) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
};
var camelizeRE = /-(\w)/g;
var camelize = cacheStringFunction((str) => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : "");
});
var hyphenateRE = /\B([A-Z])/g;
var hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, "-$1").toLowerCase());
var capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
var toHandlerKey = cacheStringFunction((str) => str ? `on${capitalize(str)}` : ``);
var hasChanged = (value, oldValue) => value !== oldValue && (value === value || oldValue === oldValue);
var targetMap = /* @__PURE__ */ new WeakMap();
var effectStack = [];
var activeEffect;
var ITERATE_KEY = Symbol(true ? "iterate" : "");
var MAP_KEY_ITERATE_KEY = Symbol(true ? "Map key iterate" : "");
function isEffect(fn) {
  return fn && fn._isEffect === true;
}
function effect2(fn, options = EMPTY_OBJ) {
  if (isEffect(fn)) {
    fn = fn.raw;
  }
  const effect3 = createReactiveEffect(fn, options);
  if (!options.lazy) {
    effect3();
  }
  return effect3;
}
function stop(effect3) {
  if (effect3.active) {
    cleanup(effect3);
    if (effect3.options.onStop) {
      effect3.options.onStop();
    }
    effect3.active = false;
  }
}
var uid = 0;
function createReactiveEffect(fn, options) {
  const effect3 = function reactiveEffect() {
    if (!effect3.active) {
      return fn();
    }
    if (!effectStack.includes(effect3)) {
      cleanup(effect3);
      try {
        enableTracking();
        effectStack.push(effect3);
        activeEffect = effect3;
        return fn();
      } finally {
        effectStack.pop();
        resetTracking();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };
  effect3.id = uid++;
  effect3.allowRecurse = !!options.allowRecurse;
  effect3._isEffect = true;
  effect3.active = true;
  effect3.raw = fn;
  effect3.deps = [];
  effect3.options = options;
  return effect3;
}
function cleanup(effect3) {
  const { deps } = effect3;
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect3);
    }
    deps.length = 0;
  }
}
var shouldTrack = true;
var trackStack = [];
function pauseTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = false;
}
function enableTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = true;
}
function resetTracking() {
  const last = trackStack.pop();
  shouldTrack = last === void 0 ? true : last;
}
function track(target, type, key) {
  if (!shouldTrack || activeEffect === void 0) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, dep = /* @__PURE__ */ new Set());
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
    if (activeEffect.options.onTrack) {
      activeEffect.options.onTrack({
        effect: activeEffect,
        target,
        type,
        key
      });
    }
  }
}
function trigger(target, type, key, newValue, oldValue, oldTarget) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const effects = /* @__PURE__ */ new Set();
  const add2 = (effectsToAdd) => {
    if (effectsToAdd) {
      effectsToAdd.forEach((effect3) => {
        if (effect3 !== activeEffect || effect3.allowRecurse) {
          effects.add(effect3);
        }
      });
    }
  };
  if (type === "clear") {
    depsMap.forEach(add2);
  } else if (key === "length" && isArray(target)) {
    depsMap.forEach((dep, key2) => {
      if (key2 === "length" || key2 >= newValue) {
        add2(dep);
      }
    });
  } else {
    if (key !== void 0) {
      add2(depsMap.get(key));
    }
    switch (type) {
      case "add":
        if (!isArray(target)) {
          add2(depsMap.get(ITERATE_KEY));
          if (isMap(target)) {
            add2(depsMap.get(MAP_KEY_ITERATE_KEY));
          }
        } else if (isIntegerKey(key)) {
          add2(depsMap.get("length"));
        }
        break;
      case "delete":
        if (!isArray(target)) {
          add2(depsMap.get(ITERATE_KEY));
          if (isMap(target)) {
            add2(depsMap.get(MAP_KEY_ITERATE_KEY));
          }
        }
        break;
      case "set":
        if (isMap(target)) {
          add2(depsMap.get(ITERATE_KEY));
        }
        break;
    }
  }
  const run = (effect3) => {
    if (effect3.options.onTrigger) {
      effect3.options.onTrigger({
        effect: effect3,
        target,
        key,
        type,
        newValue,
        oldValue,
        oldTarget
      });
    }
    if (effect3.options.scheduler) {
      effect3.options.scheduler(effect3);
    } else {
      effect3();
    }
  };
  effects.forEach(run);
}
var isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
var builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol).map((key) => Symbol[key]).filter(isSymbol));
var get2 = /* @__PURE__ */ createGetter();
var readonlyGet = /* @__PURE__ */ createGetter(true);
var arrayInstrumentations = /* @__PURE__ */ createArrayInstrumentations();
function createArrayInstrumentations() {
  const instrumentations = {};
  ["includes", "indexOf", "lastIndexOf"].forEach((key) => {
    instrumentations[key] = function(...args) {
      const arr = toRaw(this);
      for (let i = 0, l = this.length; i < l; i++) {
        track(arr, "get", i + "");
      }
      const res = arr[key](...args);
      if (res === -1 || res === false) {
        return arr[key](...args.map(toRaw));
      } else {
        return res;
      }
    };
  });
  ["push", "pop", "shift", "unshift", "splice"].forEach((key) => {
    instrumentations[key] = function(...args) {
      pauseTracking();
      const res = toRaw(this)[key].apply(this, args);
      resetTracking();
      return res;
    };
  });
  return instrumentations;
}
function createGetter(isReadonly = false, shallow = false) {
  return function get3(target, key, receiver) {
    if (key === "__v_isReactive") {
      return !isReadonly;
    } else if (key === "__v_isReadonly") {
      return isReadonly;
    } else if (key === "__v_raw" && receiver === (isReadonly ? shallow ? shallowReadonlyMap : readonlyMap : shallow ? shallowReactiveMap : reactiveMap).get(target)) {
      return target;
    }
    const targetIsArray = isArray(target);
    if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver);
    }
    const res = Reflect.get(target, key, receiver);
    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
      return res;
    }
    if (!isReadonly) {
      track(target, "get", key);
    }
    if (shallow) {
      return res;
    }
    if (isRef(res)) {
      const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
      return shouldUnwrap ? res.value : res;
    }
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive2(res);
    }
    return res;
  };
}
var set2 = /* @__PURE__ */ createSetter();
function createSetter(shallow = false) {
  return function set3(target, key, value, receiver) {
    let oldValue = target[key];
    if (!shallow) {
      value = toRaw(value);
      oldValue = toRaw(oldValue);
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        oldValue.value = value;
        return true;
      }
    }
    const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
    const result = Reflect.set(target, key, value, receiver);
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        trigger(target, "add", key, value);
      } else if (hasChanged(value, oldValue)) {
        trigger(target, "set", key, value, oldValue);
      }
    }
    return result;
  };
}
function deleteProperty(target, key) {
  const hadKey = hasOwn(target, key);
  const oldValue = target[key];
  const result = Reflect.deleteProperty(target, key);
  if (result && hadKey) {
    trigger(target, "delete", key, void 0, oldValue);
  }
  return result;
}
function has(target, key) {
  const result = Reflect.has(target, key);
  if (!isSymbol(key) || !builtInSymbols.has(key)) {
    track(target, "has", key);
  }
  return result;
}
function ownKeys(target) {
  track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
  return Reflect.ownKeys(target);
}
var mutableHandlers = {
  get: get2,
  set: set2,
  deleteProperty,
  has,
  ownKeys
};
var readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    if (true) {
      console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
    }
    return true;
  },
  deleteProperty(target, key) {
    if (true) {
      console.warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target);
    }
    return true;
  }
};
var toReactive = (value) => isObject(value) ? reactive2(value) : value;
var toReadonly = (value) => isObject(value) ? readonly(value) : value;
var toShallow = (value) => value;
var getProto = (v) => Reflect.getPrototypeOf(v);
function get$1(target, key, isReadonly = false, isShallow = false) {
  target = target[
    "__v_raw"
    /* RAW */
  ];
  const rawTarget = toRaw(target);
  const rawKey = toRaw(key);
  if (key !== rawKey) {
    !isReadonly && track(rawTarget, "get", key);
  }
  !isReadonly && track(rawTarget, "get", rawKey);
  const { has: has2 } = getProto(rawTarget);
  const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
  if (has2.call(rawTarget, key)) {
    return wrap(target.get(key));
  } else if (has2.call(rawTarget, rawKey)) {
    return wrap(target.get(rawKey));
  } else if (target !== rawTarget) {
    target.get(key);
  }
}
function has$1(key, isReadonly = false) {
  const target = this[
    "__v_raw"
    /* RAW */
  ];
  const rawTarget = toRaw(target);
  const rawKey = toRaw(key);
  if (key !== rawKey) {
    !isReadonly && track(rawTarget, "has", key);
  }
  !isReadonly && track(rawTarget, "has", rawKey);
  return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
}
function size(target, isReadonly = false) {
  target = target[
    "__v_raw"
    /* RAW */
  ];
  !isReadonly && track(toRaw(target), "iterate", ITERATE_KEY);
  return Reflect.get(target, "size", target);
}
function add(value) {
  value = toRaw(value);
  const target = toRaw(this);
  const proto = getProto(target);
  const hadKey = proto.has.call(target, value);
  if (!hadKey) {
    target.add(value);
    trigger(target, "add", value, value);
  }
  return this;
}
function set$1(key, value) {
  value = toRaw(value);
  const target = toRaw(this);
  const { has: has2, get: get3 } = getProto(target);
  let hadKey = has2.call(target, key);
  if (!hadKey) {
    key = toRaw(key);
    hadKey = has2.call(target, key);
  } else if (true) {
    checkIdentityKeys(target, has2, key);
  }
  const oldValue = get3.call(target, key);
  target.set(key, value);
  if (!hadKey) {
    trigger(target, "add", key, value);
  } else if (hasChanged(value, oldValue)) {
    trigger(target, "set", key, value, oldValue);
  }
  return this;
}
function deleteEntry(key) {
  const target = toRaw(this);
  const { has: has2, get: get3 } = getProto(target);
  let hadKey = has2.call(target, key);
  if (!hadKey) {
    key = toRaw(key);
    hadKey = has2.call(target, key);
  } else if (true) {
    checkIdentityKeys(target, has2, key);
  }
  const oldValue = get3 ? get3.call(target, key) : void 0;
  const result = target.delete(key);
  if (hadKey) {
    trigger(target, "delete", key, void 0, oldValue);
  }
  return result;
}
function clear() {
  const target = toRaw(this);
  const hadItems = target.size !== 0;
  const oldTarget = true ? isMap(target) ? new Map(target) : new Set(target) : void 0;
  const result = target.clear();
  if (hadItems) {
    trigger(target, "clear", void 0, void 0, oldTarget);
  }
  return result;
}
function createForEach(isReadonly, isShallow) {
  return function forEach(callback, thisArg) {
    const observed = this;
    const target = observed[
      "__v_raw"
      /* RAW */
    ];
    const rawTarget = toRaw(target);
    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
    !isReadonly && track(rawTarget, "iterate", ITERATE_KEY);
    return target.forEach((value, key) => {
      return callback.call(thisArg, wrap(value), wrap(key), observed);
    });
  };
}
function createIterableMethod(method, isReadonly, isShallow) {
  return function(...args) {
    const target = this[
      "__v_raw"
      /* RAW */
    ];
    const rawTarget = toRaw(target);
    const targetIsMap = isMap(rawTarget);
    const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
    const isKeyOnly = method === "keys" && targetIsMap;
    const innerIterator = target[method](...args);
    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
    !isReadonly && track(rawTarget, "iterate", isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
    return {
      // iterator protocol
      next() {
        const { value, done } = innerIterator.next();
        return done ? { value, done } : {
          value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
          done
        };
      },
      // iterable protocol
      [Symbol.iterator]() {
        return this;
      }
    };
  };
}
function createReadonlyMethod(type) {
  return function(...args) {
    if (true) {
      const key = args[0] ? `on key "${args[0]}" ` : ``;
      console.warn(`${capitalize(type)} operation ${key}failed: target is readonly.`, toRaw(this));
    }
    return type === "delete" ? false : this;
  };
}
function createInstrumentations() {
  const mutableInstrumentations2 = {
    get(key) {
      return get$1(this, key);
    },
    get size() {
      return size(this);
    },
    has: has$1,
    add,
    set: set$1,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, false)
  };
  const shallowInstrumentations2 = {
    get(key) {
      return get$1(this, key, false, true);
    },
    get size() {
      return size(this);
    },
    has: has$1,
    add,
    set: set$1,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, true)
  };
  const readonlyInstrumentations2 = {
    get(key) {
      return get$1(this, key, true);
    },
    get size() {
      return size(this, true);
    },
    has(key) {
      return has$1.call(this, key, true);
    },
    add: createReadonlyMethod(
      "add"
      /* ADD */
    ),
    set: createReadonlyMethod(
      "set"
      /* SET */
    ),
    delete: createReadonlyMethod(
      "delete"
      /* DELETE */
    ),
    clear: createReadonlyMethod(
      "clear"
      /* CLEAR */
    ),
    forEach: createForEach(true, false)
  };
  const shallowReadonlyInstrumentations2 = {
    get(key) {
      return get$1(this, key, true, true);
    },
    get size() {
      return size(this, true);
    },
    has(key) {
      return has$1.call(this, key, true);
    },
    add: createReadonlyMethod(
      "add"
      /* ADD */
    ),
    set: createReadonlyMethod(
      "set"
      /* SET */
    ),
    delete: createReadonlyMethod(
      "delete"
      /* DELETE */
    ),
    clear: createReadonlyMethod(
      "clear"
      /* CLEAR */
    ),
    forEach: createForEach(true, true)
  };
  const iteratorMethods = ["keys", "values", "entries", Symbol.iterator];
  iteratorMethods.forEach((method) => {
    mutableInstrumentations2[method] = createIterableMethod(method, false, false);
    readonlyInstrumentations2[method] = createIterableMethod(method, true, false);
    shallowInstrumentations2[method] = createIterableMethod(method, false, true);
    shallowReadonlyInstrumentations2[method] = createIterableMethod(method, true, true);
  });
  return [
    mutableInstrumentations2,
    readonlyInstrumentations2,
    shallowInstrumentations2,
    shallowReadonlyInstrumentations2
  ];
}
var [mutableInstrumentations, readonlyInstrumentations, shallowInstrumentations, shallowReadonlyInstrumentations] = /* @__PURE__ */ createInstrumentations();
function createInstrumentationGetter(isReadonly, shallow) {
  const instrumentations = shallow ? isReadonly ? shallowReadonlyInstrumentations : shallowInstrumentations : isReadonly ? readonlyInstrumentations : mutableInstrumentations;
  return (target, key, receiver) => {
    if (key === "__v_isReactive") {
      return !isReadonly;
    } else if (key === "__v_isReadonly") {
      return isReadonly;
    } else if (key === "__v_raw") {
      return target;
    }
    return Reflect.get(hasOwn(instrumentations, key) && key in target ? instrumentations : target, key, receiver);
  };
}
var mutableCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, false)
};
var readonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, false)
};
function checkIdentityKeys(target, has2, key) {
  const rawKey = toRaw(key);
  if (rawKey !== key && has2.call(target, rawKey)) {
    const type = toRawType(target);
    console.warn(`Reactive ${type} contains both the raw and reactive versions of the same object${type === `Map` ? ` as keys` : ``}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`);
  }
}
var reactiveMap = /* @__PURE__ */ new WeakMap();
var shallowReactiveMap = /* @__PURE__ */ new WeakMap();
var readonlyMap = /* @__PURE__ */ new WeakMap();
var shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
function targetTypeMap(rawType) {
  switch (rawType) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function getTargetType(value) {
  return value[
    "__v_skip"
    /* SKIP */
  ] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawType(value));
}
function reactive2(target) {
  if (target && target[
    "__v_isReadonly"
    /* IS_READONLY */
  ]) {
    return target;
  }
  return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
}
function readonly(target) {
  return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
}
function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers, proxyMap) {
  if (!isObject(target)) {
    if (true) {
      console.warn(`value cannot be made reactive: ${String(target)}`);
    }
    return target;
  }
  if (target[
    "__v_raw"
    /* RAW */
  ] && !(isReadonly && target[
    "__v_isReactive"
    /* IS_REACTIVE */
  ])) {
    return target;
  }
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const targetType = getTargetType(target);
  if (targetType === 0) {
    return target;
  }
  const proxy = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers);
  proxyMap.set(target, proxy);
  return proxy;
}
function toRaw(observed) {
  return observed && toRaw(observed[
    "__v_raw"
    /* RAW */
  ]) || observed;
}
function isRef(r) {
  return Boolean(r && r.__v_isRef === true);
}
magic("nextTick", () => nextTick);
magic("dispatch", (el) => dispatch.bind(dispatch, el));
magic("watch", (el, { evaluateLater: evaluateLater2, cleanup: cleanup2 }) => (key, callback) => {
  let evaluate2 = evaluateLater2(key);
  let getter = () => {
    let value;
    evaluate2((i) => value = i);
    return value;
  };
  let unwatch = watch(getter, callback);
  cleanup2(unwatch);
});
magic("store", getStores);
magic("data", (el) => scope(el));
magic("root", (el) => closestRoot(el));
magic("refs", (el) => {
  if (el._x_refs_proxy)
    return el._x_refs_proxy;
  el._x_refs_proxy = mergeProxies(getArrayOfRefObject(el));
  return el._x_refs_proxy;
});
function getArrayOfRefObject(el) {
  let refObjects = [];
  findClosest(el, (i) => {
    if (i._x_refs)
      refObjects.push(i._x_refs);
  });
  return refObjects;
}
var globalIdMemo = {};
function findAndIncrementId(name) {
  if (!globalIdMemo[name])
    globalIdMemo[name] = 0;
  return ++globalIdMemo[name];
}
function closestIdRoot(el, name) {
  return findClosest(el, (element) => {
    if (element._x_ids && element._x_ids[name])
      return true;
  });
}
function setIdRoot(el, name) {
  if (!el._x_ids)
    el._x_ids = {};
  if (!el._x_ids[name])
    el._x_ids[name] = findAndIncrementId(name);
}
magic("id", (el, { cleanup: cleanup2 }) => (name, key = null) => {
  let cacheKey = `${name}${key ? `-${key}` : ""}`;
  return cacheIdByNameOnElement(el, cacheKey, cleanup2, () => {
    let root = closestIdRoot(el, name);
    let id = root ? root._x_ids[name] : findAndIncrementId(name);
    return key ? `${name}-${id}-${key}` : `${name}-${id}`;
  });
});
interceptClone((from, to) => {
  if (from._x_id) {
    to._x_id = from._x_id;
  }
});
function cacheIdByNameOnElement(el, cacheKey, cleanup2, callback) {
  if (!el._x_id)
    el._x_id = {};
  if (el._x_id[cacheKey])
    return el._x_id[cacheKey];
  let output = callback();
  el._x_id[cacheKey] = output;
  cleanup2(() => {
    delete el._x_id[cacheKey];
  });
  return output;
}
magic("el", (el) => el);
warnMissingPluginMagic("Focus", "focus", "focus");
warnMissingPluginMagic("Persist", "persist", "persist");
function warnMissingPluginMagic(name, magicName, slug) {
  magic(magicName, (el) => warn(`You can't use [$${magicName}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`, el));
}
directive("modelable", (el, { expression }, { effect: effect3, evaluateLater: evaluateLater2, cleanup: cleanup2 }) => {
  let func = evaluateLater2(expression);
  let innerGet = () => {
    let result;
    func((i) => result = i);
    return result;
  };
  let evaluateInnerSet = evaluateLater2(`${expression} = __placeholder`);
  let innerSet = (val) => evaluateInnerSet(() => {
  }, { scope: { "__placeholder": val } });
  let initialValue = innerGet();
  innerSet(initialValue);
  queueMicrotask(() => {
    if (!el._x_model)
      return;
    el._x_removeModelListeners["default"]();
    let outerGet = el._x_model.get;
    let outerSet = el._x_model.setWithModifiers;
    let releaseEntanglement = entangle(
      {
        get() {
          return outerGet();
        },
        set(value) {
          outerSet(value);
        }
      },
      {
        get() {
          return innerGet();
        },
        set(value) {
          innerSet(value);
        }
      }
    );
    cleanup2(releaseEntanglement);
  });
});
directive("teleport", (el, { modifiers, expression }, { cleanup: cleanup2 }) => {
  if (el.tagName.toLowerCase() !== "template")
    warn("x-teleport can only be used on a <template> tag", el);
  let target = getTarget(expression);
  let clone2 = el.content.cloneNode(true).firstElementChild;
  el._x_teleport = clone2;
  clone2._x_teleportBack = el;
  el.setAttribute("data-teleport-template", true);
  clone2.setAttribute("data-teleport-target", true);
  if (el._x_forwardEvents) {
    el._x_forwardEvents.forEach((eventName) => {
      clone2.addEventListener(eventName, (e) => {
        e.stopPropagation();
        el.dispatchEvent(new e.constructor(e.type, e));
      });
    });
  }
  addScopeToNode(clone2, {}, el);
  let placeInDom = (clone3, target2, modifiers2) => {
    if (modifiers2.includes("prepend")) {
      target2.parentNode.insertBefore(clone3, target2);
    } else if (modifiers2.includes("append")) {
      target2.parentNode.insertBefore(clone3, target2.nextSibling);
    } else {
      target2.appendChild(clone3);
    }
  };
  mutateDom(() => {
    skipDuringClone(() => {
      placeInDom(clone2, target, modifiers);
      initTree(clone2);
    })();
  });
  el._x_teleportPutBack = () => {
    let target2 = getTarget(expression);
    mutateDom(() => {
      placeInDom(el._x_teleport, target2, modifiers);
    });
  };
  cleanup2(
    () => mutateDom(() => {
      clone2.remove();
      destroyTree(clone2);
    })
  );
});
var teleportContainerDuringClone = document.createElement("div");
function getTarget(expression) {
  let target = skipDuringClone(() => {
    return document.querySelector(expression);
  }, () => {
    return teleportContainerDuringClone;
  })();
  if (!target)
    warn(`Cannot find x-teleport element for selector: "${expression}"`);
  return target;
}
var handler = () => {
};
handler.inline = (el, { modifiers }, { cleanup: cleanup2 }) => {
  modifiers.includes("self") ? el._x_ignoreSelf = true : el._x_ignore = true;
  cleanup2(() => {
    modifiers.includes("self") ? delete el._x_ignoreSelf : delete el._x_ignore;
  });
};
directive("ignore", handler);
directive("effect", skipDuringClone((el, { expression }, { effect: effect3 }) => {
  effect3(evaluateLater(el, expression));
}));
function on(el, event, modifiers, callback) {
  let listenerTarget = el;
  let handler4 = (e) => callback(e);
  let options = {};
  let wrapHandler = (callback2, wrapper) => (e) => wrapper(callback2, e);
  if (modifiers.includes("dot"))
    event = dotSyntax(event);
  if (modifiers.includes("camel"))
    event = camelCase2(event);
  if (modifiers.includes("capture"))
    options.capture = true;
  if (modifiers.includes("window"))
    listenerTarget = window;
  if (modifiers.includes("document"))
    listenerTarget = document;
  if (modifiers.includes("passive")) {
    options.passive = modifiers[modifiers.indexOf("passive") + 1] !== "false";
  }
  handler4 = addDebounceOrThrottle(modifiers, handler4);
  if (modifiers.includes("prevent"))
    handler4 = wrapHandler(handler4, (next, e) => {
      e.preventDefault();
      next(e);
    });
  if (modifiers.includes("stop"))
    handler4 = wrapHandler(handler4, (next, e) => {
      e.stopPropagation();
      next(e);
    });
  if (modifiers.includes("once")) {
    handler4 = wrapHandler(handler4, (next, e) => {
      next(e);
      listenerTarget.removeEventListener(event, handler4, options);
    });
  }
  if (modifiers.includes("away") || modifiers.includes("outside")) {
    listenerTarget = document;
    handler4 = wrapHandler(handler4, (next, e) => {
      if (el.contains(e.target))
        return;
      if (e.target.isConnected === false)
        return;
      if (el.offsetWidth < 1 && el.offsetHeight < 1)
        return;
      if (el._x_isShown === false)
        return;
      next(e);
    });
  }
  if (modifiers.includes("self"))
    handler4 = wrapHandler(handler4, (next, e) => {
      e.target === el && next(e);
    });
  if (event === "submit") {
    handler4 = wrapHandler(handler4, (next, e) => {
      if (e.target._x_pendingModelUpdates) {
        e.target._x_pendingModelUpdates.forEach((fn) => fn());
      }
      next(e);
    });
  }
  if (isKeyEvent(event) || isClickEvent(event)) {
    handler4 = wrapHandler(handler4, (next, e) => {
      if (isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers)) {
        return;
      }
      next(e);
    });
  }
  listenerTarget.addEventListener(event, handler4, options);
  return () => {
    listenerTarget.removeEventListener(event, handler4, options);
  };
}
function addDebounceOrThrottle(modifiers, handler4) {
  if (modifiers.includes("debounce")) {
    let nextModifier = modifiers[modifiers.indexOf("debounce") + 1] || "invalid-wait";
    let wait = isNumeric(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
    handler4 = debounce(handler4, wait);
  }
  if (modifiers.includes("throttle")) {
    let nextModifier = modifiers[modifiers.indexOf("throttle") + 1] || "invalid-wait";
    let wait = isNumeric(nextModifier.split("ms")[0]) ? Number(nextModifier.split("ms")[0]) : 250;
    handler4 = throttle(handler4, wait);
  }
  return handler4;
}
function dotSyntax(subject) {
  return subject.replace(/-/g, ".");
}
function camelCase2(subject) {
  return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
}
function isNumeric(subject) {
  return !Array.isArray(subject) && !isNaN(subject);
}
function kebabCase2(subject) {
  if ([" ", "_"].includes(
    subject
  ))
    return subject;
  return subject.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[_\s]/, "-").toLowerCase();
}
function isKeyEvent(event) {
  return ["keydown", "keyup"].includes(event);
}
function isClickEvent(event) {
  return ["contextmenu", "click", "mouse"].some((i) => event.includes(i));
}
function isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers) {
  let keyModifiers = modifiers.filter((i) => {
    return !["window", "document", "prevent", "stop", "once", "capture", "self", "away", "outside", "passive", "preserve-scroll", "blur", "change", "lazy"].includes(i);
  });
  if (keyModifiers.includes("debounce")) {
    let debounceIndex = keyModifiers.indexOf("debounce");
    keyModifiers.splice(debounceIndex, isNumeric((keyModifiers[debounceIndex + 1] || "invalid-wait").split("ms")[0]) ? 2 : 1);
  }
  if (keyModifiers.includes("throttle")) {
    let debounceIndex = keyModifiers.indexOf("throttle");
    keyModifiers.splice(debounceIndex, isNumeric((keyModifiers[debounceIndex + 1] || "invalid-wait").split("ms")[0]) ? 2 : 1);
  }
  if (keyModifiers.length === 0)
    return false;
  if (keyModifiers.length === 1 && keyToModifiers(e.key).includes(keyModifiers[0]))
    return false;
  const systemKeyModifiers = ["ctrl", "shift", "alt", "meta", "cmd", "super"];
  const selectedSystemKeyModifiers = systemKeyModifiers.filter((modifier) => keyModifiers.includes(modifier));
  keyModifiers = keyModifiers.filter((i) => !selectedSystemKeyModifiers.includes(i));
  if (selectedSystemKeyModifiers.length > 0) {
    const activelyPressedKeyModifiers = selectedSystemKeyModifiers.filter((modifier) => {
      if (modifier === "cmd" || modifier === "super")
        modifier = "meta";
      return e[`${modifier}Key`];
    });
    if (activelyPressedKeyModifiers.length === selectedSystemKeyModifiers.length) {
      if (isClickEvent(e.type))
        return false;
      if (keyToModifiers(e.key).includes(keyModifiers[0]))
        return false;
    }
  }
  return true;
}
function keyToModifiers(key) {
  if (!key)
    return [];
  key = kebabCase2(key);
  let modifierToKeyMap = {
    "ctrl": "control",
    "slash": "/",
    "space": " ",
    "spacebar": " ",
    "cmd": "meta",
    "esc": "escape",
    "up": "arrow-up",
    "down": "arrow-down",
    "left": "arrow-left",
    "right": "arrow-right",
    "period": ".",
    "comma": ",",
    "equal": "=",
    "minus": "-",
    "underscore": "_"
  };
  modifierToKeyMap[key] = key;
  return Object.keys(modifierToKeyMap).map((modifier) => {
    if (modifierToKeyMap[modifier] === key)
      return modifier;
  }).filter((modifier) => modifier);
}
directive("model", (el, { modifiers, expression }, { effect: effect3, cleanup: cleanup2 }) => {
  let scopeTarget = el;
  if (modifiers.includes("parent")) {
    scopeTarget = findClosest(el, (element) => element !== el);
  }
  let evaluateGet = evaluateLater(scopeTarget, expression);
  let evaluateSet;
  if (typeof expression === "string") {
    evaluateSet = evaluateLater(scopeTarget, `${expression} = __placeholder`);
  } else if (typeof expression === "function" && typeof expression() === "string") {
    evaluateSet = evaluateLater(scopeTarget, `${expression()} = __placeholder`);
  } else {
    evaluateSet = () => {
    };
  }
  let getValue = () => {
    let result;
    evaluateGet((value) => result = value);
    return isGetterSetter(result) ? result.get() : result;
  };
  let setValue = (value) => {
    let result;
    evaluateGet((value2) => result = value2);
    if (isGetterSetter(result)) {
      result.set(value);
    } else {
      evaluateSet(() => {
      }, {
        scope: { "__placeholder": value }
      });
    }
  };
  if (typeof expression === "string" && el.type === "radio") {
    mutateDom(() => {
      if (!el.hasAttribute("name"))
        el.setAttribute("name", expression);
    });
  }
  let hasChangeModifier = modifiers.includes("change") || modifiers.includes("lazy");
  let hasBlurModifier = modifiers.includes("blur");
  let hasEnterModifier = modifiers.includes("enter");
  let hasExplicitEventModifiers = hasChangeModifier || hasBlurModifier || hasEnterModifier;
  let removeListener;
  if (isCloning) {
    removeListener = () => {
    };
  } else if (hasExplicitEventModifiers) {
    let listeners = [];
    let syncValue = (e) => setValue(getInputValue(el, modifiers, e, getValue()));
    if (hasChangeModifier) {
      listeners.push(on(el, "change", modifiers, syncValue));
    }
    if (hasBlurModifier) {
      listeners.push(on(el, "blur", modifiers, syncValue));
      if (el.form) {
        let form = el.form;
        let syncCallback = () => syncValue({ target: el });
        if (!form._x_pendingModelUpdates)
          form._x_pendingModelUpdates = [];
        form._x_pendingModelUpdates.push(syncCallback);
        cleanup2(() => {
          if (form._x_pendingModelUpdates) {
            form._x_pendingModelUpdates.splice(form._x_pendingModelUpdates.indexOf(syncCallback), 1);
          }
        });
      }
    }
    if (hasEnterModifier) {
      listeners.push(on(el, "keydown", modifiers, (e) => {
        if (e.key === "Enter")
          syncValue(e);
      }));
    }
    removeListener = () => listeners.forEach((remove) => remove());
  } else {
    let event = el.tagName.toLowerCase() === "select" || ["checkbox", "radio"].includes(el.type) ? "change" : "input";
    removeListener = on(el, event, modifiers, (e) => {
      setValue(getInputValue(el, modifiers, e, getValue()));
    });
  }
  if (modifiers.includes("fill")) {
    if ([void 0, null, ""].includes(getValue()) || isCheckbox(el) && Array.isArray(getValue()) || el.tagName.toLowerCase() === "select" && el.multiple) {
      setValue(
        getInputValue(el, modifiers, { target: el }, getValue())
      );
    }
  }
  if (!el._x_removeModelListeners)
    el._x_removeModelListeners = {};
  el._x_removeModelListeners["default"] = removeListener;
  cleanup2(() => el._x_removeModelListeners["default"]());
  if (el.form) {
    let removeResetListener = on(el.form, "reset", [], (e) => {
      nextTick(() => el._x_model && el._x_model.set(getInputValue(el, modifiers, { target: el }, getValue())));
    });
    cleanup2(() => removeResetListener());
  }
  el._x_model = {
    get() {
      return getValue();
    },
    set(value) {
      setValue(value);
    },
    setWithModifiers: addDebounceOrThrottle(modifiers, setValue)
  };
  el._x_forceModelUpdate = (value) => {
    if (value === void 0 && typeof expression === "string" && expression.match(/\./))
      value = "";
    mutateDom(() => {
      if (isCheckbox(el)) {
        if (Array.isArray(value)) {
          el.checked = value.some((val) => val == el.value);
        } else {
          el.checked = !!value;
        }
      } else if (isRadio(el)) {
        if (typeof value === "boolean") {
          el.checked = safeParseBoolean(el.value) === value;
        } else {
          el.checked = el.value == value;
        }
      } else {
        bind(el, "value", value);
      }
    });
  };
  effect3(() => {
    let value = getValue();
    if (modifiers.includes("unintrusive") && document.activeElement.isSameNode(el))
      return;
    el._x_forceModelUpdate(value);
  });
});
function getInputValue(el, modifiers, event, currentValue) {
  return mutateDom(() => {
    if (event instanceof CustomEvent && event.detail !== void 0)
      return event.detail !== null && event.detail !== void 0 ? event.detail : event.target.value;
    else if (isCheckbox(el)) {
      if (Array.isArray(currentValue)) {
        let newValue = null;
        if (modifiers.includes("number")) {
          newValue = safeParseNumber(event.target.value);
        } else if (modifiers.includes("boolean")) {
          newValue = safeParseBoolean(event.target.value);
        } else {
          newValue = event.target.value;
        }
        return event.target.checked ? currentValue.includes(newValue) ? currentValue : currentValue.concat([newValue]) : currentValue.filter((el2) => !checkedAttrLooseCompare2(el2, newValue));
      } else {
        return event.target.checked;
      }
    } else if (el.tagName.toLowerCase() === "select" && el.multiple) {
      if (modifiers.includes("number")) {
        return Array.from(event.target.selectedOptions).map((option) => {
          let rawValue = option.value || option.text;
          return safeParseNumber(rawValue);
        });
      } else if (modifiers.includes("boolean")) {
        return Array.from(event.target.selectedOptions).map((option) => {
          let rawValue = option.value || option.text;
          return safeParseBoolean(rawValue);
        });
      }
      return Array.from(event.target.selectedOptions).map((option) => {
        return option.value || option.text;
      });
    } else {
      let newValue;
      if (isRadio(el)) {
        if (event.target.checked) {
          newValue = event.target.value;
        } else {
          newValue = currentValue;
        }
      } else {
        newValue = event.target.value;
      }
      if (modifiers.includes("number")) {
        return safeParseNumber(newValue);
      } else if (modifiers.includes("boolean")) {
        return safeParseBoolean(newValue);
      } else if (modifiers.includes("trim")) {
        return newValue.trim();
      } else {
        return newValue;
      }
    }
  });
}
function safeParseNumber(rawValue) {
  let number = rawValue ? parseFloat(rawValue) : null;
  return isNumeric2(number) ? number : rawValue;
}
function checkedAttrLooseCompare2(valueA, valueB) {
  return valueA == valueB;
}
function isNumeric2(subject) {
  return !Array.isArray(subject) && !isNaN(subject);
}
function isGetterSetter(value) {
  return value !== null && typeof value === "object" && typeof value.get === "function" && typeof value.set === "function";
}
directive("cloak", (el) => queueMicrotask(() => mutateDom(() => el.removeAttribute(prefix("cloak")))));
addInitSelector(() => `[${prefix("init")}]`);
directive("init", skipDuringClone((el, { expression }, { evaluate: evaluate2 }) => {
  if (typeof expression === "string") {
    return !!expression.trim() && evaluate2(expression, {}, false);
  }
  return evaluate2(expression, {}, false);
}));
directive("text", (el, { expression }, { effect: effect3, evaluateLater: evaluateLater2 }) => {
  let evaluate2 = evaluateLater2(expression);
  effect3(() => {
    evaluate2((value) => {
      mutateDom(() => {
        el.textContent = value;
      });
    });
  });
});
directive("html", (el, { expression }, { effect: effect3, evaluateLater: evaluateLater2 }) => {
  let evaluate2 = evaluateLater2(expression);
  effect3(() => {
    evaluate2((value) => {
      mutateDom(() => {
        el.innerHTML = value ?? "";
        el._x_ignoreSelf = true;
        initTree(el);
        delete el._x_ignoreSelf;
      });
    });
  });
});
mapAttributes(startingWith(":", into(prefix("bind:"))));
var handler2 = (el, { value, modifiers, expression, original }, { effect: effect3, cleanup: cleanup2 }) => {
  if (!value) {
    let bindingProviders = {};
    injectBindingProviders(bindingProviders);
    let getBindings = evaluateLater(el, expression);
    getBindings((bindings) => {
      applyBindingsObject(el, bindings, original);
    }, { scope: bindingProviders });
    return;
  }
  if (value === "key")
    return storeKeyForXFor(el, expression);
  if (el._x_inlineBindings && el._x_inlineBindings[value] && el._x_inlineBindings[value].extract) {
    return;
  }
  let evaluate2 = evaluateLater(el, expression);
  effect3(() => evaluate2((result) => {
    if (result === void 0 && typeof expression === "string" && expression.match(/\./)) {
      result = "";
    }
    mutateDom(() => bind(el, value, result, modifiers));
  }));
  cleanup2(() => {
    el._x_undoAddedClasses && el._x_undoAddedClasses();
    el._x_undoAddedStyles && el._x_undoAddedStyles();
  });
};
handler2.inline = (el, { value, modifiers, expression }) => {
  if (!value)
    return;
  if (!el._x_inlineBindings)
    el._x_inlineBindings = {};
  el._x_inlineBindings[value] = { expression, extract: false };
};
directive("bind", handler2);
function storeKeyForXFor(el, expression) {
  el._x_keyExpression = expression;
}
addRootSelector(() => `[${prefix("data")}]`);
directive("data", (el, { expression }, { cleanup: cleanup2 }) => {
  if (shouldSkipRegisteringDataDuringClone(el))
    return;
  expression = expression === "" ? "{}" : expression;
  let magicContext = {};
  injectMagics(magicContext, el);
  let dataProviderContext = {};
  injectDataProviders(dataProviderContext, magicContext);
  let data2 = evaluate(el, expression, { scope: dataProviderContext });
  if (data2 === void 0 || data2 === true)
    data2 = {};
  injectMagics(data2, el);
  let reactiveData = reactive(data2);
  initInterceptors(reactiveData);
  let undo = addScopeToNode(el, reactiveData);
  reactiveData["init"] && evaluate(el, reactiveData["init"]);
  cleanup2(() => {
    reactiveData["destroy"] && evaluate(el, reactiveData["destroy"]);
    undo();
  });
});
interceptClone((from, to) => {
  if (from._x_dataStack) {
    to._x_dataStack = from._x_dataStack;
    to.setAttribute("data-has-alpine-state", true);
  }
});
function shouldSkipRegisteringDataDuringClone(el) {
  if (!isCloning)
    return false;
  if (isCloningLegacy)
    return true;
  return el.hasAttribute("data-has-alpine-state");
}
directive("show", (el, { modifiers, expression }, { effect: effect3 }) => {
  let evaluate2 = evaluateLater(el, expression);
  if (!el._x_doHide)
    el._x_doHide = () => {
      mutateDom(() => {
        el.style.setProperty("display", "none", modifiers.includes("important") ? "important" : void 0);
      });
    };
  if (!el._x_doShow)
    el._x_doShow = () => {
      mutateDom(() => {
        if (el.style.length === 1 && el.style.display === "none") {
          el.removeAttribute("style");
        } else {
          el.style.removeProperty("display");
        }
      });
    };
  let hide = () => {
    el._x_doHide();
    el._x_isShown = false;
  };
  let show = () => {
    el._x_doShow();
    el._x_isShown = true;
  };
  let clickAwayCompatibleShow = () => setTimeout(show);
  let toggle = once(
    (value) => value ? show() : hide(),
    (value) => {
      if (typeof el._x_toggleAndCascadeWithTransitions === "function") {
        el._x_toggleAndCascadeWithTransitions(el, value, show, hide);
      } else {
        value ? clickAwayCompatibleShow() : hide();
      }
    }
  );
  let oldValue;
  let firstTime = true;
  effect3(() => evaluate2((value) => {
    if (!firstTime && value === oldValue)
      return;
    if (modifiers.includes("immediate"))
      value ? clickAwayCompatibleShow() : hide();
    toggle(value);
    oldValue = value;
    firstTime = false;
  }));
});
directive("for", (el, { expression }, { effect: effect3, cleanup: cleanup2 }) => {
  let iteratorNames = parseForExpression(expression);
  let evaluateItems = evaluateLater(el, iteratorNames.items);
  let evaluateKey = evaluateLater(
    el,
    // the x-bind:key expression is stored for our use instead of evaluated.
    el._x_keyExpression || "index"
  );
  el._x_lookup = /* @__PURE__ */ new Map();
  effect3(() => loop(el, iteratorNames, evaluateItems, evaluateKey));
  cleanup2(() => {
    el._x_lookup.forEach(
      (el2) => mutateDom(() => {
        destroyTree(el2);
        el2.remove();
      })
    );
    delete el._x_lookup;
  });
});
function refreshScope(scope2) {
  return (newScope) => {
    Object.entries(newScope).forEach(([key, value]) => {
      scope2[key] = value;
    });
  };
}
function loop(templateEl, iteratorNames, evaluateItems, evaluateKey) {
  evaluateItems((items) => {
    if (isNumeric3(items))
      items = Array.from({ length: items }, (_, i) => i + 1);
    if (items === void 0 || items === null)
      items = [];
    if (items instanceof Set)
      items = Array.from(items);
    if (items instanceof Map)
      items = Array.from(items);
    let oldLookup = templateEl._x_lookup;
    let lookup = /* @__PURE__ */ new Map();
    templateEl._x_lookup = lookup;
    let hasStringKeys = isObject2(items);
    let scopeEntries = Object.entries(items).map(([index, item]) => {
      if (!hasStringKeys)
        index = parseInt(index);
      let scope2 = getIterationScopeVariables(iteratorNames, item, index, items);
      let key;
      evaluateKey((innerKey) => {
        if (typeof innerKey === "object")
          warn("x-for key cannot be an object, it must be a string or an integer", templateEl);
        if (oldLookup.has(innerKey)) {
          lookup.set(innerKey, oldLookup.get(innerKey));
          oldLookup.delete(innerKey);
        }
        key = innerKey;
      }, { scope: { index, ...scope2 } });
      return [key, scope2];
    });
    mutateDom(() => {
      oldLookup.forEach((el) => {
        destroyTree(el);
        el.remove();
      });
      let added = /* @__PURE__ */ new Set();
      let prev = templateEl;
      scopeEntries.forEach(([key, scope2]) => {
        if (lookup.has(key)) {
          let el = lookup.get(key);
          el._x_refreshXForScope(scope2);
          if (prev.nextElementSibling !== el) {
            if (prev.nextElementSibling)
              el.replaceWith(prev.nextElementSibling);
            prev.after(el);
          }
          prev = el;
          if (el._x_currentIfEl) {
            if (el.nextElementSibling !== el._x_currentIfEl)
              prev.after(el._x_currentIfEl);
            prev = el._x_currentIfEl;
          }
          return;
        }
        if (templateEl.content.children.length > 1)
          warn("x-for templates require a single root element, additional elements will be ignored.", templateEl);
        let clone2 = document.importNode(templateEl.content, true).firstElementChild;
        let reactiveScope = reactive(scope2);
        addScopeToNode(clone2, reactiveScope, templateEl);
        clone2._x_refreshXForScope = refreshScope(reactiveScope);
        lookup.set(key, clone2);
        added.add(clone2);
        prev.after(clone2);
        prev = clone2;
      });
      skipDuringClone(() => added.forEach((clone2) => initTree(clone2)))();
    });
  });
}
function parseForExpression(expression) {
  let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
  let stripParensRE = /^\s*\(|\)\s*$/g;
  let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
  let inMatch = expression.match(forAliasRE);
  if (!inMatch)
    return;
  let res = {};
  res.items = inMatch[2].trim();
  let item = inMatch[1].replace(stripParensRE, "").trim();
  let iteratorMatch = item.match(forIteratorRE);
  if (iteratorMatch) {
    res.item = item.replace(forIteratorRE, "").trim();
    res.index = iteratorMatch[1].trim();
    if (iteratorMatch[2]) {
      res.collection = iteratorMatch[2].trim();
    }
  } else {
    res.item = item;
  }
  return res;
}
function getIterationScopeVariables(iteratorNames, item, index, items) {
  let scopeVariables = {};
  if (/^\[.*\]$/.test(iteratorNames.item) && Array.isArray(item)) {
    let names = iteratorNames.item.replace("[", "").replace("]", "").split(",").map((i) => i.trim());
    names.forEach((name, i) => {
      scopeVariables[name] = item[i];
    });
  } else if (/^\{.*\}$/.test(iteratorNames.item) && !Array.isArray(item) && typeof item === "object") {
    let names = iteratorNames.item.replace("{", "").replace("}", "").split(",").map((i) => i.trim());
    names.forEach((name) => {
      scopeVariables[name] = item[name];
    });
  } else {
    scopeVariables[iteratorNames.item] = item;
  }
  if (iteratorNames.index)
    scopeVariables[iteratorNames.index] = index;
  if (iteratorNames.collection)
    scopeVariables[iteratorNames.collection] = items;
  return scopeVariables;
}
function isNumeric3(subject) {
  return typeof subject !== "object" && !isNaN(subject);
}
function isObject2(subject) {
  return typeof subject === "object" && !Array.isArray(subject);
}
function handler3() {
}
handler3.inline = (el, { expression }, { cleanup: cleanup2 }) => {
  let root = closestRoot(el);
  if (!root)
    return;
  if (!root._x_refs)
    root._x_refs = {};
  root._x_refs[expression] = el;
  cleanup2(() => delete root._x_refs[expression]);
};
directive("ref", handler3);
directive("if", (el, { expression }, { effect: effect3, cleanup: cleanup2 }) => {
  if (el.tagName.toLowerCase() !== "template")
    warn("x-if can only be used on a <template> tag", el);
  let evaluate2 = evaluateLater(el, expression);
  let show = () => {
    if (el._x_currentIfEl)
      return el._x_currentIfEl;
    let clone2 = el.content.cloneNode(true).firstElementChild;
    addScopeToNode(clone2, {}, el);
    mutateDom(() => {
      el.after(clone2);
      skipDuringClone(() => initTree(clone2))();
    });
    el._x_currentIfEl = clone2;
    el._x_undoIf = () => {
      mutateDom(() => {
        destroyTree(clone2);
        clone2.remove();
      });
      delete el._x_currentIfEl;
    };
    return clone2;
  };
  let hide = () => {
    if (!el._x_undoIf)
      return;
    el._x_undoIf();
    delete el._x_undoIf;
  };
  effect3(() => evaluate2((value) => {
    value ? show() : hide();
  }));
  cleanup2(() => el._x_undoIf && el._x_undoIf());
});
directive("id", (el, { expression }, { evaluate: evaluate2 }) => {
  let names = evaluate2(expression);
  names.forEach((name) => setIdRoot(el, name));
});
interceptClone((from, to) => {
  if (from._x_ids) {
    to._x_ids = from._x_ids;
  }
});
mapAttributes(startingWith("@", into(prefix("on:"))));
directive("on", skipDuringClone((el, { value, modifiers, expression }, { cleanup: cleanup2 }) => {
  let evaluate2 = expression ? evaluateLater(el, expression) : () => {
  };
  if (el.tagName.toLowerCase() === "template") {
    if (!el._x_forwardEvents)
      el._x_forwardEvents = [];
    if (!el._x_forwardEvents.includes(value))
      el._x_forwardEvents.push(value);
  }
  let removeListener = on(el, value, modifiers, (e) => {
    evaluate2(() => {
    }, { scope: { "$event": e }, params: [e] });
  });
  cleanup2(() => removeListener());
}));
warnMissingPluginDirective("Collapse", "collapse", "collapse");
warnMissingPluginDirective("Intersect", "intersect", "intersect");
warnMissingPluginDirective("Focus", "trap", "focus");
warnMissingPluginDirective("Mask", "mask", "mask");
function warnMissingPluginDirective(name, directiveName, slug) {
  directive(directiveName, (el) => warn(`You can't use [x-${directiveName}] without first installing the "${name}" plugin here: https://alpinejs.dev/plugins/${slug}`, el));
}
alpine_default.setEvaluator(normalEvaluator);
alpine_default.setRawEvaluator(normalRawEvaluator);
alpine_default.setReactivityEngine({ reactive: reactive2, effect: effect2, release: stop, raw: toRaw });
var src_default = alpine_default;
var module_default = src_default;

// src/shared/types.ts
var PAGE_SIZES = {
  // ISO A
  a0: { width: 2383.94, height: 3370.39, label: "A0", group: "iso-a" },
  a1: { width: 1683.78, height: 2383.94, label: "A1", group: "iso-a" },
  a2: { width: 1190.55, height: 1683.78, label: "A2", group: "iso-a" },
  a3: { width: 841.89, height: 1190.55, label: "A3", group: "iso-a" },
  a4: { width: 595.28, height: 841.89, label: "A4", group: "iso-a" },
  a5: { width: 419.53, height: 595.28, label: "A5", group: "iso-a" },
  a6: { width: 297.64, height: 419.53, label: "A6", group: "iso-a" },
  a7: { width: 209.76, height: 297.64, label: "A7", group: "iso-a" },
  a8: { width: 147.4, height: 209.76, label: "A8", group: "iso-a" },
  a9: { width: 104.88, height: 147.4, label: "A9", group: "iso-a" },
  a10: { width: 73.7, height: 104.88, label: "A10", group: "iso-a" },
  // ISO B
  b0: { width: 2834.65, height: 4008.19, label: "B0", group: "iso-b" },
  b1: { width: 2004.09, height: 2834.65, label: "B1", group: "iso-b" },
  b2: { width: 1417.32, height: 2004.09, label: "B2", group: "iso-b" },
  b3: { width: 1000.63, height: 1417.32, label: "B3", group: "iso-b" },
  b4: { width: 708.66, height: 1000.63, label: "B4", group: "iso-b" },
  b5: { width: 498.9, height: 708.66, label: "B5", group: "iso-b" },
  b6: { width: 354.33, height: 498.9, label: "B6", group: "iso-b" },
  b7: { width: 249.45, height: 354.33, label: "B7", group: "iso-b" },
  b8: { width: 175.75, height: 249.45, label: "B8", group: "iso-b" },
  b9: { width: 124.72, height: 175.75, label: "B9", group: "iso-b" },
  b10: { width: 87.87, height: 124.72, label: "B10", group: "iso-b" },
  // ISO C / envelopes
  c4: { width: 649.13, height: 918.43, label: "C4", group: "iso-c" },
  c5: { width: 459.21, height: 649.13, label: "C5", group: "iso-c" },
  c6: { width: 323.15, height: 459.21, label: "C6", group: "iso-c" },
  dl: { width: 311.81, height: 623.62, label: "DL", group: "iso-c" },
  // North America
  letter: { width: 612, height: 792, label: "Letter", group: "us" },
  legal: { width: 612, height: 1008, label: "Legal", group: "us" },
  tabloid: { width: 792, height: 1224, label: "Tabloid", group: "us" },
  ledger: { width: 1224, height: 792, label: "Ledger", group: "us" },
  executive: { width: 522, height: 756, label: "Executive", group: "us" },
  statement: { width: 396, height: 612, label: "Statement", group: "us" },
  folio: { width: 612, height: 936, label: "Folio", group: "us" },
  quarto: { width: 540, height: 720, label: "Quarto", group: "us" },
  governmentLetter: { width: 576, height: 756, label: "Government Letter", group: "us" },
  governmentLegal: { width: 612, height: 936, label: "Government Legal", group: "us" },
  juniorLegal: { width: 360, height: 576, label: "Junior Legal", group: "us" },
  // ANSI / Architectural
  archA: { width: 648, height: 864, label: "Arch A", group: "arch" },
  archB: { width: 864, height: 1296, label: "Arch B", group: "arch" },
  archC: { width: 1296, height: 1728, label: "Arch C", group: "arch" },
  archD: { width: 1728, height: 2592, label: "Arch D", group: "arch" },
  archE: { width: 2592, height: 3456, label: "Arch E", group: "arch" },
  // Photo & cards
  photo4x6: { width: 288, height: 432, label: '4 \xD7 6"', group: "photo" },
  photo5x7: { width: 360, height: 504, label: '5 \xD7 7"', group: "photo" },
  photo8x10: { width: 576, height: 720, label: '8 \xD7 10"', group: "photo" },
  photo8x12: { width: 576, height: 864, label: '8 \xD7 12"', group: "photo" },
  businessCard: { width: 252, height: 144, label: "Business card", group: "photo" },
  // Other
  square: { width: 600, height: 600, label: "Square", group: "other" },
  squareSmall: { width: 432, height: 432, label: 'Square (6")', group: "other" },
  widescreen: { width: 792, height: 445.5, label: "Widescreen 16:9", group: "other" },
  presentation: { width: 720, height: 540, label: "Presentation 4:3", group: "other" }
};
var PAGE_SIZE_GROUP_LABELS = {
  "iso-a": "ISO A",
  "iso-b": "ISO B",
  "iso-c": "Envelopes (ISO C)",
  us: "North America",
  arch: "Architectural",
  photo: "Photo & cards",
  other: "Other"
};
var PAGE_SIZE_GROUP_ORDER = [
  "iso-a",
  "iso-b",
  "iso-c",
  "us",
  "arch",
  "photo",
  "other"
];
var PAGE_SIZE_OPTIONS = Object.keys(PAGE_SIZES).map((id) => ({
  id,
  label: PAGE_SIZES[id].label,
  group: PAGE_SIZES[id].group
}));
var PAGE_SIZE_GROUPS = PAGE_SIZE_GROUP_ORDER.map((group) => ({
  id: group,
  label: PAGE_SIZE_GROUP_LABELS[group],
  options: PAGE_SIZE_OPTIONS.filter((o) => o.group === group)
}));
var GOOGLE_FONTS = [
  { id: "Inter", label: "Inter", css: "Inter, sans-serif" },
  { id: "Roboto", label: "Roboto", css: "Roboto, sans-serif" },
  { id: "OpenSans", label: "Open Sans", css: '"Open Sans", sans-serif' },
  { id: "Lora", label: "Lora", css: "Lora, serif" },
  { id: "Playfair", label: "Playfair Display", css: '"Playfair Display", serif' }
];

// src/client/factories.ts
function uid2() {
  return crypto.randomUUID();
}
function blankPage() {
  return { id: uid2(), elements: [] };
}
function defaultDoc() {
  return {
    id: uid2(),
    name: "Untitled document",
    pageSize: "a4",
    pageBackground: "#faf9f6",
    showGrid: false,
    pages: [blankPage()],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function createText(x, y, overrides = {}) {
  return {
    id: uid2(),
    type: "text",
    x,
    y,
    width: 220,
    height: 40,
    rotation: 0,
    opacity: 1,
    locked: false,
    content: "Double-click to edit",
    fontSize: 18,
    fontFamily: "Helvetica",
    fontWeight: "normal",
    fontStyle: "normal",
    underline: false,
    lineHeight: 1.25,
    letterSpacing: 0,
    listStyle: "none",
    color: "#1a1a1a",
    align: "left",
    ...overrides
  };
}
function createRect(x, y, overrides = {}) {
  return {
    id: uid2(),
    type: "rect",
    x,
    y,
    width: 160,
    height: 100,
    rotation: 0,
    opacity: 1,
    locked: false,
    fill: "#0d9488",
    stroke: "#0f766e",
    strokeWidth: 0,
    cornerRadius: 0,
    ...overrides
  };
}
function createEllipse(x, y, overrides = {}) {
  return {
    id: uid2(),
    type: "ellipse",
    x,
    y,
    width: 140,
    height: 100,
    rotation: 0,
    opacity: 1,
    locked: false,
    fill: "#f59e0b",
    stroke: "#b45309",
    strokeWidth: 0,
    ...overrides
  };
}
function createLine(x, y, overrides = {}) {
  return {
    id: uid2(),
    type: "line",
    x,
    y,
    width: 180,
    height: 0,
    rotation: 0,
    opacity: 1,
    locked: false,
    stroke: "#1a1a1a",
    strokeWidth: 2,
    ...overrides
  };
}
function createImage(x, y, data2) {
  return {
    id: uid2(),
    type: "image",
    x,
    y,
    width: data2.width,
    height: data2.height,
    rotation: 0,
    opacity: 1,
    locked: false,
    src: data2.src,
    name: data2.name
  };
}
function createSignature(x, y, data2) {
  return {
    id: uid2(),
    type: "signature",
    x,
    y,
    width: data2.width,
    height: data2.height,
    rotation: 0,
    opacity: 1,
    locked: false,
    src: data2.src,
    name: data2.name
  };
}
function createArrow(x, y, overrides = {}) {
  return {
    id: uid2(),
    type: "arrow",
    x,
    y,
    width: 160,
    height: 40,
    rotation: 0,
    opacity: 1,
    locked: false,
    stroke: "#0f766e",
    strokeWidth: 3,
    headSize: 14,
    ...overrides
  };
}
function createSticky(x, y, overrides = {}) {
  return {
    id: uid2(),
    type: "sticky",
    x,
    y,
    width: 160,
    height: 140,
    rotation: -2,
    opacity: 1,
    locked: false,
    content: "Note\u2026",
    fill: "#fef08a",
    color: "#422006",
    fontSize: 14,
    ...overrides
  };
}
function createBadge(x, y, overrides = {}) {
  return {
    id: uid2(),
    type: "badge",
    x,
    y,
    width: 120,
    height: 32,
    rotation: 0,
    opacity: 1,
    locked: false,
    label: "NEW",
    fill: "#0d9488",
    color: "#ffffff",
    fontSize: 12,
    ...overrides
  };
}
function createCheckbox(x, y, overrides = {}) {
  return {
    id: uid2(),
    type: "checkbox",
    x,
    y,
    width: 200,
    height: 28,
    rotation: 0,
    opacity: 1,
    locked: false,
    label: "Checklist item",
    checked: false,
    color: "#1a1a1a",
    fontSize: 14,
    ...overrides
  };
}
function createDivider(x, y, overrides = {}) {
  return {
    id: uid2(),
    type: "divider",
    x,
    y,
    width: 400,
    height: 8,
    rotation: 0,
    opacity: 1,
    locked: false,
    stroke: "#94a3b8",
    strokeWidth: 2,
    style: "solid",
    ...overrides
  };
}
function createIcon(x, y, icon = "star", overrides = {}) {
  return {
    id: uid2(),
    type: "icon",
    x,
    y,
    width: 48,
    height: 48,
    rotation: 0,
    opacity: 1,
    locked: false,
    icon,
    color: "#0d9488",
    ...overrides
  };
}
function createTable(x, y, overrides = {}) {
  const rows = overrides.rows ?? 3;
  const cols = overrides.cols ?? 3;
  const cells = overrides.cells ?? Array.from(
    { length: rows * cols },
    (_, i) => i < cols ? `Header ${i + 1}` : `Cell ${i - cols + 1}`
  );
  return {
    id: uid2(),
    type: "table",
    x,
    y,
    width: 420,
    height: 120,
    rotation: 0,
    opacity: 1,
    locked: false,
    header: true,
    fill: "#ffffff",
    headerFill: "#0f766e",
    stroke: "#cbd5e1",
    color: "#1a1a1a",
    fontSize: 11,
    ...overrides,
    rows,
    cols,
    cells
  };
}
function createStamp(x, y, overrides = {}) {
  return {
    id: uid2(),
    type: "stamp",
    x,
    y,
    width: 140,
    height: 140,
    rotation: -12,
    opacity: 0.85,
    locked: false,
    label: "APPROVED",
    color: "#dc2626",
    fontSize: 16,
    ...overrides
  };
}
function createFormText(x, y, overrides = {}) {
  return {
    id: uid2(),
    type: "formText",
    x,
    y,
    width: 200,
    height: 28,
    rotation: 0,
    opacity: 1,
    locked: false,
    name: `field_${uid2().slice(0, 8)}`,
    placeholder: "Enter text\u2026",
    multiline: false,
    fontSize: 12,
    color: "#1a1a1a",
    borderColor: "#94a3b8",
    ...overrides
  };
}
function createFormCheck(x, y, overrides = {}) {
  return {
    id: uid2(),
    type: "formCheck",
    x,
    y,
    width: 180,
    height: 24,
    rotation: 0,
    opacity: 1,
    locked: false,
    name: `check_${uid2().slice(0, 8)}`,
    label: "Option",
    checked: false,
    color: "#1a1a1a",
    fontSize: 12,
    ...overrides
  };
}
function createFormSelect(x, y, overrides = {}) {
  return {
    id: uid2(),
    type: "formSelect",
    x,
    y,
    width: 180,
    height: 28,
    rotation: 0,
    opacity: 1,
    locked: false,
    name: `select_${uid2().slice(0, 8)}`,
    options: ["Option A", "Option B", "Option C"],
    fontSize: 12,
    color: "#1a1a1a",
    borderColor: "#94a3b8",
    ...overrides
  };
}
function cloneElement(el, offset = 16) {
  const copy = structuredClone(el);
  copy.id = uid2();
  copy.x += offset;
  copy.y += offset;
  copy.locked = false;
  return copy;
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function elementLabel(el) {
  switch (el.type) {
    case "text":
      return el.content.slice(0, 24) || "Text";
    case "image":
      return el.name || "Image";
    case "signature":
      return el.name || "Signature";
    case "sticky":
      return el.content.slice(0, 24) || "Sticky";
    case "badge":
      return el.label || "Badge";
    case "checkbox":
      return el.label.slice(0, 24) || "Checkbox";
    case "stamp":
      return el.label || "Stamp";
    case "icon":
      return el.icon;
    case "table":
      return `Table ${el.rows}\xD7${el.cols}`;
    case "formText":
      return el.name || "Form text";
    case "formCheck":
      return el.label || "Form check";
    case "formSelect":
      return el.name || "Form select";
    default:
      return el.type.charAt(0).toUpperCase() + el.type.slice(1);
  }
}

// src/client/fonts.ts
var STANDARD_FONTS = [
  { id: "Helvetica", label: "Helvetica", css: "Helvetica, Arial, sans-serif" },
  { id: "Times-Roman", label: "Times", css: '"Times New Roman", Times, serif' },
  { id: "Courier", label: "Courier", css: '"Courier New", Courier, monospace' }
];
function fontCssFamily(family) {
  const std = STANDARD_FONTS.find((f) => f.id === family);
  if (std) return std.css;
  const google = GOOGLE_FONTS.find((f) => f.id === family);
  if (google) return google.css;
  return STANDARD_FONTS[0].css;
}
function allFontOptions() {
  return [
    ...STANDARD_FONTS.map((f) => ({ id: f.id, label: f.label })),
    ...GOOGLE_FONTS.map((f) => ({ id: f.id, label: f.label }))
  ];
}

// src/client/history.ts
var MAX = 60;
var HistoryStack = class {
  constructor() {
    __publicField(this, "past", []);
    __publicField(this, "future", []);
    __publicField(this, "lastPushed", "");
  }
  reset(doc) {
    this.past = [];
    this.future = [];
    this.lastPushed = JSON.stringify(doc);
  }
  push(doc) {
    const snapshot = JSON.stringify(doc);
    if (snapshot === this.lastPushed) return;
    this.past.push(this.lastPushed);
    if (this.past.length > MAX) this.past.shift();
    this.future = [];
    this.lastPushed = snapshot;
  }
  undo(current) {
    if (!this.past.length) return null;
    this.future.push(JSON.stringify(current));
    const prev = this.past.pop();
    this.lastPushed = prev;
    return JSON.parse(prev);
  }
  redo(current) {
    if (!this.future.length) return null;
    this.past.push(JSON.stringify(current));
    const next = this.future.pop();
    this.lastPushed = next;
    return JSON.parse(next);
  }
  get canUndo() {
    return this.past.length > 0;
  }
  get canRedo() {
    return this.future.length > 0;
  }
};

// src/client/icons.ts
var ICON_PATHS = {
  star: "M12 2l2.9 6.9L22 10l-5 4.5L18.2 22 12 18.2 5.8 22 7 14.5 2 10l7.1-1.1L12 2z",
  heart: "M12 21s-7-4.4-9.5-8.2C.4 9.5 2.2 5.5 6 5.5c2 0 3.4 1.1 4 2.2.6-1.1 2-2.2 4-2.2 3.8 0 5.6 4 3.5 7.3C19 16.6 12 21 12 21z",
  check: "M5 13l4 4L19 7",
  x: "M6 6l12 12M18 6L6 18",
  warning: "M12 3l10 18H2L12 3zm0 6v5m0 3h.01",
  info: "M12 3a9 9 0 100 18 9 9 0 000-18zm0 8v5m0-8h.01",
  mail: "M3 6h18v12H3V6zm0 0l9 7 9-7",
  phone: "M6.5 3h3l1.5 4-2 1.5a12 12 0 005.5 5.5L16 12.5l4 1.5v3A2 2 0 0118 19 14 14 0 015 6a2 2 0 011.5-3z",
  pin: "M12 22s7-5.2 7-12a7 7 0 10-14 0c0 6.8 7 12 7 12zm0-9a3 3 0 110-6 3 3 0 010 6z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-7 2-7 4.5V20h14v-1.5C19 16 16 14 12 14z"
};
function iconSvg(icon, color, size2 = 24) {
  const d = ICON_PATHS[icon] ?? ICON_PATHS.star;
  const strokeIcons = ["check", "x", "warning", "info", "mail"];
  if (strokeIcons.includes(icon)) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size2}" height="${size2}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size2}" height="${size2}" viewBox="0 0 24 24" fill="${color}"><path d="${d}"/></svg>`;
}

// src/client/library.ts
var LIBRARY_CATEGORIES = [
  { id: "all", label: "All elements" },
  { id: "favorites", label: "Favorites" },
  { id: "recent", label: "Recent" },
  { id: "basics", label: "Basics" },
  { id: "shapes", label: "Shapes" },
  { id: "notes", label: "Notes" },
  { id: "presets", label: "Presets" },
  { id: "layout", label: "Layout" },
  { id: "forms", label: "Forms" },
  { id: "brand", label: "Brand" },
  { id: "data", label: "Data" },
  { id: "icons", label: "Icons" },
  { id: "stamps", label: "Stamps" }
];
var LIBRARY_ITEMS = [
  // Basics
  { id: "text", category: "basics", label: "Text", hint: "Editable paragraph", tags: ["text", "paragraph", "copy"], kind: "text", preview: "T" },
  { id: "image", category: "basics", label: "Image", hint: "Upload PNG/JPEG", tags: ["photo", "picture", "media"], kind: "image", preview: "\u{1F5BC}" },
  { id: "sign", category: "basics", label: "Signature", hint: "Draw, type, or upload", tags: ["sign", "signature", "ink"], kind: "signature", preview: "\u270D" },
  { id: "divider", category: "basics", label: "Divider", hint: "Horizontal rule", tags: ["line", "hr", "separator"], kind: "divider", preview: "\u2014" },
  { id: "divider-dash", category: "basics", label: "Dashed line", hint: "Dashed divider", tags: ["line", "dashed"], kind: "preset:divider-dash", preview: "- -" },
  { id: "divider-thick", category: "basics", label: "Thick rule", hint: "Bold separator", tags: ["line", "bold"], kind: "preset:divider-thick", preview: "\u2501\u2501" },
  { id: "spacer", category: "basics", label: "Spacer box", hint: "Invisible layout gap", tags: ["space", "gap"], kind: "preset:spacer", preview: "\u2195" },
  // Shapes
  { id: "rect", category: "shapes", label: "Rectangle", hint: "Filled box", tags: ["box", "shape"], kind: "rect", preview: "\u25AD" },
  { id: "ellipse", category: "shapes", label: "Ellipse", hint: "Circle / oval", tags: ["oval", "shape"], kind: "ellipse", preview: "\u25CB" },
  { id: "line", category: "shapes", label: "Line", hint: "Straight stroke", tags: ["stroke"], kind: "line", preview: "/" },
  { id: "arrow", category: "shapes", label: "Arrow", hint: "Directional arrow", tags: ["pointer", "direction"], kind: "arrow", preview: "\u2192" },
  { id: "arrow-down", category: "shapes", label: "Arrow down", hint: "Vertical arrow", tags: ["pointer"], kind: "preset:arrow-down", preview: "\u2193" },
  { id: "rounded", category: "shapes", label: "Rounded box", hint: "Soft corners", tags: ["card"], kind: "preset:rounded", preview: "\u25A2" },
  { id: "frame", category: "shapes", label: "Frame", hint: "Stroke only", tags: ["border"], kind: "preset:frame", preview: "\u25A1" },
  { id: "circle", category: "shapes", label: "Circle", hint: "Perfect circle", tags: ["dot"], kind: "preset:circle", preview: "\u25CF" },
  { id: "triangle", category: "shapes", label: "Accent wedge", hint: "Diagonal block", tags: ["shape"], kind: "preset:wedge", preview: "\u25E2" },
  { id: "shadow-card", category: "shapes", label: "Card block", hint: "Soft card surface", tags: ["card", "ui"], kind: "preset:card", preview: "\u25AD" },
  // Notes
  { id: "sticky", category: "notes", label: "Sticky note", hint: "Yellow memo", tags: ["note", "memo"], kind: "sticky", preview: "\u{1F5D2}" },
  { id: "sticky-pink", category: "notes", label: "Pink sticky", hint: "Soft pink note", tags: ["note"], kind: "preset:sticky-pink", preview: "\u{1F4DD}" },
  { id: "sticky-mint", category: "notes", label: "Mint sticky", hint: "Mint memo", tags: ["note"], kind: "preset:sticky-mint", preview: "\u{1F4D7}" },
  { id: "sticky-blue", category: "notes", label: "Blue sticky", hint: "Cool blue note", tags: ["note"], kind: "preset:sticky-blue", preview: "\u{1F4D8}" },
  { id: "badge", category: "notes", label: "Badge", hint: "Pill label", tags: ["chip", "tag"], kind: "badge", preview: "\u25CF" },
  { id: "checkbox", category: "notes", label: "Checkbox", hint: "Checklist row", tags: ["todo", "check"], kind: "checkbox", preview: "\u2611" },
  { id: "checkbox-done", category: "notes", label: "Checked item", hint: "Already done", tags: ["todo"], kind: "preset:checkbox-done", preview: "\u2713" },
  { id: "badge-sale", category: "notes", label: "Sale badge", hint: "Promo chip", tags: ["promo"], kind: "badge:SALE", preview: "%" },
  { id: "badge-new", category: "notes", label: "New badge", hint: "Highlight chip", tags: ["promo"], kind: "badge:NEW", preview: "N" },
  { id: "badge-vip", category: "notes", label: "VIP badge", hint: "Gold chip", tags: ["promo"], kind: "preset:badge-vip", preview: "\u2605" },
  { id: "badge-hot", category: "notes", label: "Hot badge", hint: "Attention chip", tags: ["promo"], kind: "preset:badge-hot", preview: "\u{1F525}" },
  // Presets — typography / content blocks
  { id: "heading", category: "presets", label: "Heading", hint: "Bold title", tags: ["title", "h1"], kind: "preset:heading", preview: "H" },
  { id: "subhead", category: "presets", label: "Subheading", hint: "Section title", tags: ["h2"], kind: "preset:subhead", preview: "h" },
  { id: "quote", category: "presets", label: "Quote", hint: "Pull quote block", tags: ["blockquote"], kind: "preset:quote", preview: "\u201C" },
  { id: "callout", category: "presets", label: "Callout", hint: "Accent tip box", tags: ["tip", "info"], kind: "preset:callout", preview: "!" },
  { id: "warning-box", category: "presets", label: "Warning box", hint: "Alert callout", tags: ["alert"], kind: "preset:warning-box", preview: "\u26A0" },
  { id: "caption", category: "presets", label: "Caption", hint: "Small muted text", tags: ["footnote"], kind: "preset:caption", preview: "c" },
  { id: "highlight", category: "presets", label: "Highlight bar", hint: "Accent strip", tags: ["marker"], kind: "preset:highlight", preview: "\u25AC" },
  { id: "footer", category: "presets", label: "Page footer", hint: "Footer line + text", tags: ["footer"], kind: "preset:footer", preview: "\u2310" },
  { id: "date", category: "presets", label: "Date stamp", hint: "Today\u2019s date", tags: ["date"], kind: "preset:date", preview: "\u{1F4C5}" },
  { id: "bullets", category: "presets", label: "Bullet list", hint: "3 bullet points", tags: ["list", "ul"], kind: "preset:bullets", preview: "\u2022" },
  { id: "numbers", category: "presets", label: "Numbered list", hint: "1\u20133 steps", tags: ["list", "ol"], kind: "preset:numbers", preview: "1." },
  { id: "cta", category: "presets", label: "CTA button", hint: "Call to action", tags: ["button", "cta"], kind: "preset:cta", preview: "\u2192" },
  { id: "signature-line", category: "presets", label: "Signature line", hint: "Blank sign-here line", tags: ["sign", "line"], kind: "preset:signature", preview: "___" },
  { id: "address", category: "presets", label: "Address block", hint: "Contact address", tags: ["address", "contact"], kind: "preset:address", preview: "\u2302" },
  // Layout
  { id: "header-bar", category: "layout", label: "Header bar", hint: "Full-width top band", tags: ["header", "banner"], kind: "preset:header-bar", preview: "\u25AC" },
  { id: "sidebar-band", category: "layout", label: "Side band", hint: "Left accent strip", tags: ["sidebar"], kind: "preset:sidebar-band", preview: "|" },
  { id: "two-col", category: "layout", label: "Two columns", hint: "Paired text blocks", tags: ["columns", "grid"], kind: "preset:two-col", preview: "\u25A5" },
  { id: "hero-title", category: "layout", label: "Hero title", hint: "Large cover title", tags: ["cover", "hero"], kind: "preset:hero-title", preview: "A" },
  { id: "page-number", category: "layout", label: "Page number", hint: "Centered folio", tags: ["page", "folio"], kind: "preset:page-number", preview: "#" },
  { id: "section-rule", category: "layout", label: "Section break", hint: "Title + rule", tags: ["section"], kind: "preset:section-rule", preview: "\xA7" },
  // Forms
  { id: "form-name", category: "forms", label: "Name field", hint: "Label + underline", tags: ["form", "input"], kind: "preset:form-name", preview: "_" },
  { id: "form-email", category: "forms", label: "Email field", hint: "Email underline", tags: ["form"], kind: "preset:form-email", preview: "@" },
  { id: "form-date", category: "forms", label: "Date field", hint: "Date underline", tags: ["form"], kind: "preset:form-date", preview: "/" },
  { id: "form-check-row", category: "forms", label: "Agree row", hint: "Consent checkbox", tags: ["form", "gdpr"], kind: "preset:form-check", preview: "\u2610" },
  { id: "rating", category: "forms", label: "Star rating", hint: "5-star score", tags: ["rating", "stars"], kind: "preset:rating", preview: "\u2605\u2605" },
  { id: "progress", category: "forms", label: "Progress bar", hint: "70% filled bar", tags: ["progress", "meter"], kind: "preset:progress", preview: "\u25B0" },
  { id: "qr-box", category: "forms", label: "QR placeholder", hint: "Square QR frame", tags: ["qr", "code"], kind: "preset:qr", preview: "\u25A3" },
  // Brand
  { id: "logo-mark", category: "brand", label: "Logo mark", hint: "Round brand mark", tags: ["logo", "brand"], kind: "preset:logo-mark", preview: "PS" },
  { id: "brand-name", category: "brand", label: "Brand name", hint: "Company title", tags: ["logo", "name"], kind: "preset:brand-name", preview: "Aa" },
  { id: "tagline", category: "brand", label: "Tagline", hint: "Short slogan", tags: ["slogan"], kind: "preset:tagline", preview: "\u2026" },
  { id: "watermark", category: "brand", label: "Watermark", hint: "Faded diagonal text", tags: ["watermark"], kind: "preset:watermark", preview: "WM" },
  { id: "color-swatch", category: "brand", label: "Color swatches", hint: "3 brand colors", tags: ["palette"], kind: "preset:swatches", preview: "\u25D0" },
  // Data
  { id: "table", category: "data", label: "Table 3\xD73", hint: "Simple grid", tags: ["table"], kind: "table", preview: "\u25A6" },
  { id: "table-wide", category: "data", label: "Table 4\xD75", hint: "Wider grid", tags: ["table"], kind: "preset:table-wide", preview: "\u25A6" },
  { id: "table-invoice", category: "data", label: "Invoice lines", hint: "Desc / Qty / Price", tags: ["invoice", "table"], kind: "preset:table-invoice", preview: "\u25A4" },
  { id: "price-row", category: "data", label: "Price row", hint: "Label + amount", tags: ["price"], kind: "preset:price-row", preview: "\u20AC" },
  { id: "totals", category: "data", label: "Totals block", hint: "Subtotal / tax / total", tags: ["invoice", "sum"], kind: "preset:totals", preview: "\u03A3" },
  { id: "kpi", category: "data", label: "KPI card", hint: "Big number + label", tags: ["metric", "stat"], kind: "preset:kpi", preview: "42" },
  { id: "timeline", category: "data", label: "Timeline step", hint: "Step marker + text", tags: ["timeline"], kind: "preset:timeline", preview: "\u2460" },
  // Icons
  { id: "icon-star", category: "icons", label: "Star", hint: "Icon", tags: ["icon"], kind: "icon:star", preview: "\u2605" },
  { id: "icon-heart", category: "icons", label: "Heart", hint: "Icon", tags: ["icon"], kind: "icon:heart", preview: "\u2665" },
  { id: "icon-check", category: "icons", label: "Check", hint: "Icon", tags: ["icon"], kind: "icon:check", preview: "\u2713" },
  { id: "icon-x", category: "icons", label: "Close", hint: "Icon", tags: ["icon"], kind: "icon:x", preview: "\u2715" },
  { id: "icon-warn", category: "icons", label: "Warning", hint: "Icon", tags: ["icon"], kind: "icon:warning", preview: "!" },
  { id: "icon-info", category: "icons", label: "Info", hint: "Icon", tags: ["icon"], kind: "icon:info", preview: "i" },
  { id: "icon-mail", category: "icons", label: "Mail", hint: "Icon", tags: ["icon"], kind: "icon:mail", preview: "@" },
  { id: "icon-phone", category: "icons", label: "Phone", hint: "Icon", tags: ["icon"], kind: "icon:phone", preview: "\u260E" },
  { id: "icon-pin", category: "icons", label: "Pin", hint: "Icon", tags: ["icon"], kind: "icon:pin", preview: "\u{1F4CD}" },
  { id: "icon-user", category: "icons", label: "User", hint: "Icon", tags: ["icon"], kind: "icon:user", preview: "\u263A" },
  // Stamps
  { id: "stamp-ok", category: "stamps", label: "Approved", hint: "Round stamp", tags: ["stamp"], kind: "stamp:APPROVED", preview: "OK" },
  { id: "stamp-draft", category: "stamps", label: "Draft", hint: "Round stamp", tags: ["stamp"], kind: "stamp:DRAFT", preview: "DR" },
  { id: "stamp-paid", category: "stamps", label: "Paid", hint: "Round stamp", tags: ["stamp"], kind: "stamp:PAID", preview: "$" },
  { id: "stamp-conf", category: "stamps", label: "Confidential", hint: "Round stamp", tags: ["stamp"], kind: "stamp:CONFIDENTIAL", preview: "\u{1F512}" },
  { id: "stamp-urgent", category: "stamps", label: "Urgent", hint: "Round stamp", tags: ["stamp"], kind: "stamp:URGENT", preview: "!!" },
  { id: "stamp-copy", category: "stamps", label: "Copy", hint: "Round stamp", tags: ["stamp"], kind: "stamp:COPY", preview: "\xA9" },
  { id: "stamp-void", category: "stamps", label: "Void", hint: "Round stamp", tags: ["stamp"], kind: "stamp:VOID", preview: "\u2300" },
  { id: "stamp-sample", category: "stamps", label: "Sample", hint: "Round stamp", tags: ["stamp"], kind: "stamp:SAMPLE", preview: "SM" },
  { id: "stamp-final", category: "stamps", label: "Final", hint: "Round stamp", tags: ["stamp"], kind: "stamp:FINAL", preview: "FN" }
];
function createPreset(id, x, y) {
  switch (id) {
    case "divider-dash":
      return createDivider(x, y, { style: "dashed", stroke: "#64748b" });
    case "divider-thick":
      return createDivider(x, y, { strokeWidth: 5, stroke: "#1a1a1a", height: 12 });
    case "spacer":
      return createRect(x, y, {
        width: 200,
        height: 40,
        fill: "#ffffff",
        stroke: "#e2e8f0",
        strokeWidth: 1,
        opacity: 0.35,
        cornerRadius: 4
      });
    case "rounded":
      return createRect(x, y, { cornerRadius: 16, fill: "#14b8a6", strokeWidth: 0 });
    case "frame":
      return createRect(x, y, { fill: "#ffffff", stroke: "#0f766e", strokeWidth: 2, cornerRadius: 4 });
    case "circle":
      return createEllipse(x, y, { width: 120, height: 120, fill: "#0d9488" });
    case "wedge":
      return createRect(x, y, { width: 80, height: 180, fill: "#0f766e", strokeWidth: 0, rotation: -8 });
    case "card":
      return createRect(x, y, {
        width: 280,
        height: 160,
        fill: "#ffffff",
        stroke: "#cbd5e1",
        strokeWidth: 1,
        cornerRadius: 12
      });
    case "arrow-down":
      return createArrow(x, y, { width: 20, height: 140, rotation: 90, stroke: "#0f766e" });
    case "sticky-pink":
      return createSticky(x, y, { fill: "#fbcfe8", color: "#831843" });
    case "sticky-mint":
      return createSticky(x, y, { fill: "#a7f3d0", color: "#064e3b" });
    case "sticky-blue":
      return createSticky(x, y, { fill: "#bfdbfe", color: "#1e3a8a" });
    case "checkbox-done":
      return createCheckbox(x, y, { checked: true, label: "Completed task" });
    case "badge-vip":
      return createBadge(x, y, { label: "VIP", fill: "#ca8a04", color: "#fffbeb" });
    case "badge-hot":
      return createBadge(x, y, { label: "HOT", fill: "#ea580c", color: "#fff7ed" });
    case "heading":
      return createText(x, y, {
        content: "Heading",
        fontSize: 32,
        fontWeight: "bold",
        width: 360,
        height: 44
      });
    case "subhead":
      return createText(x, y, {
        content: "Subheading",
        fontSize: 20,
        fontWeight: "bold",
        width: 320,
        height: 32
      });
    case "quote":
      return createText(x, y, {
        content: "\u201CA short pull quote that stands out on the page.\u201D",
        fontSize: 16,
        fontFamily: "Times-Roman",
        width: 360,
        height: 70,
        color: "#334155"
      });
    case "callout":
      return createRect(x, y, {
        width: 360,
        height: 72,
        fill: "#ecfdf5",
        stroke: "#0d9488",
        strokeWidth: 1.5,
        cornerRadius: 8
      });
    case "warning-box":
      return createRect(x, y, {
        width: 360,
        height: 72,
        fill: "#fff7ed",
        stroke: "#ea580c",
        strokeWidth: 1.5,
        cornerRadius: 8
      });
    case "caption":
      return createText(x, y, {
        content: "Figure caption or footnote",
        fontSize: 10,
        color: "#64748b",
        width: 280,
        height: 20
      });
    case "highlight":
      return createRect(x, y, {
        width: 420,
        height: 28,
        fill: "#fef08a",
        strokeWidth: 0,
        cornerRadius: 4
      });
    case "footer":
      return createText(x, y, {
        content: "Page footer \xB7 PDF Studio",
        fontSize: 10,
        color: "#94a3b8",
        width: 400,
        height: 18,
        align: "center"
      });
    case "date":
      return createText(x, y, {
        content: (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric"
        }),
        fontSize: 12,
        color: "#475569",
        width: 220,
        height: 22
      });
    case "bullets":
      return createText(x, y, {
        content: "\u2022 First highlight\n\u2022 Second highlight\n\u2022 Third highlight",
        fontSize: 13,
        width: 280,
        height: 80
      });
    case "numbers":
      return createText(x, y, {
        content: "1. Discover\n2. Design\n3. Deliver",
        fontSize: 13,
        width: 240,
        height: 80
      });
    case "cta":
      return createBadge(x, y, {
        label: "Get started \u2192",
        width: 160,
        height: 40,
        fontSize: 13,
        fill: "#0f766e"
      });
    case "signature":
      return createText(x, y, {
        content: "Signature: _______________________",
        fontSize: 12,
        width: 320,
        height: 24
      });
    case "address":
      return createText(x, y, {
        content: "Company Name\n123 Design Avenue\nBerlin, Germany",
        fontSize: 11,
        color: "#475569",
        width: 200,
        height: 60
      });
    case "header-bar":
      return createRect(x, y, {
        width: 595,
        height: 72,
        fill: "#0f766e",
        strokeWidth: 0,
        cornerRadius: 0
      });
    case "sidebar-band":
      return createRect(x, y, {
        width: 36,
        height: 842,
        fill: "#134e4a",
        strokeWidth: 0
      });
    case "two-col":
      return createText(x, y, {
        content: "Column A\nDetails go here.\n\nColumn B\nMore details.",
        fontSize: 12,
        width: 420,
        height: 110
      });
    case "hero-title":
      return createText(x, y, {
        content: "Your big idea",
        fontSize: 48,
        fontWeight: "bold",
        width: 480,
        height: 64
      });
    case "page-number":
      return createText(x, y, {
        content: "\u2014 1 \u2014",
        fontSize: 11,
        color: "#94a3b8",
        width: 80,
        height: 20,
        align: "center"
      });
    case "section-rule":
      return createText(x, y, {
        content: "SECTION 01  \u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014",
        fontSize: 11,
        fontWeight: "bold",
        width: 480,
        height: 22,
        color: "#0f766e"
      });
    case "form-name":
      return createText(x, y, {
        content: "Full name\n________________________________",
        fontSize: 12,
        width: 320,
        height: 44
      });
    case "form-email":
      return createText(x, y, {
        content: "Email\n________________________________",
        fontSize: 12,
        width: 320,
        height: 44
      });
    case "form-date":
      return createText(x, y, {
        content: "Date\n____ / ____ / ________",
        fontSize: 12,
        width: 240,
        height: 44
      });
    case "form-check":
      return createCheckbox(x, y, {
        label: "I agree to the terms and conditions",
        width: 340
      });
    case "rating":
      return createText(x, y, {
        content: "\u2605\u2605\u2605\u2605\u2606  4.0",
        fontSize: 18,
        color: "#ca8a04",
        width: 160,
        height: 28
      });
    case "progress":
      return createRect(x, y, {
        width: 280,
        height: 16,
        fill: "#ccfbf1",
        stroke: "#0d9488",
        strokeWidth: 1,
        cornerRadius: 8
      });
    case "qr":
      return createRect(x, y, {
        width: 96,
        height: 96,
        fill: "#ffffff",
        stroke: "#1a1a1a",
        strokeWidth: 2,
        cornerRadius: 4
      });
    case "logo-mark":
      return createEllipse(x, y, {
        width: 64,
        height: 64,
        fill: "#0d9488",
        strokeWidth: 0
      });
    case "brand-name":
      return createText(x, y, {
        content: "PDF Studio",
        fontSize: 22,
        fontWeight: "bold",
        width: 200,
        height: 32
      });
    case "tagline":
      return createText(x, y, {
        content: "Design documents that feel finished.",
        fontSize: 12,
        color: "#64748b",
        width: 280,
        height: 24
      });
    case "watermark":
      return createText(x, y, {
        content: "DRAFT",
        fontSize: 64,
        fontWeight: "bold",
        color: "#94a3b8",
        opacity: 0.25,
        rotation: -24,
        width: 280,
        height: 70
      });
    case "swatches":
      return createRect(x, y, {
        width: 180,
        height: 40,
        fill: "#0d9488",
        strokeWidth: 0,
        cornerRadius: 6
      });
    case "table-wide":
      return createTable(x, y, {
        rows: 5,
        cols: 4,
        width: 480,
        height: 180,
        cells: Array.from(
          { length: 20 },
          (_, i) => i < 4 ? `Col ${i + 1}` : `R${Math.floor(i / 4)}C${i % 4 + 1}`
        )
      });
    case "table-invoice":
      return createTable(x, y, {
        rows: 4,
        cols: 3,
        width: 460,
        height: 140,
        cells: [
          "Description",
          "Qty",
          "Price",
          "Design services",
          "1",
          "\u20AC1,200",
          "Hosting",
          "1",
          "\u20AC240",
          "Support pack",
          "1",
          "\u20AC180"
        ]
      });
    case "price-row":
      return createText(x, y, {
        content: "Design package ........................ \u20AC890",
        fontSize: 13,
        width: 420,
        height: 24
      });
    case "totals":
      return createText(x, y, {
        content: "Subtotal          \u20AC1,620\nTax (19%)           \u20AC308\nTotal             \u20AC1,928",
        fontSize: 13,
        fontWeight: "bold",
        width: 220,
        height: 70,
        align: "right"
      });
    case "kpi":
      return createText(x, y, {
        content: "98%\nCustomer satisfaction",
        fontSize: 28,
        fontWeight: "bold",
        width: 200,
        height: 70,
        color: "#0f766e"
      });
    case "timeline":
      return createText(x, y, {
        content: "\u2460  Discovery call\n    Align goals and timeline",
        fontSize: 13,
        width: 260,
        height: 50
      });
    default:
      return createText(x, y);
  }
}
function createFromLibrary(kind, x, y) {
  if (kind === "image") return "image";
  if (kind === "signature") return "signature";
  if (kind === "text") return createText(x, y);
  if (kind === "rect") return createRect(x, y);
  if (kind === "ellipse") return createEllipse(x, y);
  if (kind === "line") return createLine(x, y);
  if (kind === "arrow") return createArrow(x, y);
  if (kind === "sticky") return createSticky(x, y);
  if (kind === "badge") return createBadge(x, y);
  if (kind === "checkbox") return createCheckbox(x, y);
  if (kind === "divider") return createDivider(x, y);
  if (kind === "table") return createTable(x, y);
  if (kind.startsWith("icon:")) {
    return createIcon(x, y, kind.slice(5));
  }
  if (kind.startsWith("badge:")) {
    const label = kind.slice(6);
    return createBadge(x, y, {
      label,
      fill: label === "NEW" ? "#2563eb" : "#e11d48"
    });
  }
  if (kind.startsWith("stamp:")) {
    const label = kind.slice(6);
    const colors = {
      APPROVED: "#16a34a",
      PAID: "#2563eb",
      URGENT: "#ea580c",
      COPY: "#475569",
      VOID: "#64748b",
      DRAFT: "#dc2626",
      CONFIDENTIAL: "#dc2626",
      SAMPLE: "#7c3aed",
      FINAL: "#0f766e"
    };
    return createStamp(x, y, {
      label,
      color: colors[label] ?? "#dc2626",
      fontSize: label.length > 8 ? 11 : 16
    });
  }
  if (kind.startsWith("preset:")) {
    return createPreset(kind.slice(7), x, y);
  }
  return createText(x, y);
}
function matchesLibraryQuery(item, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return item.label.toLowerCase().includes(q) || item.hint.toLowerCase().includes(q) || item.category.includes(q) || item.tags.some((t) => t.includes(q));
}

// src/shared/session.ts
var SESSION_COOKIE = "pdf-studio-sid";
var SESSION_HEADER = "X-Pdf-Studio-Session";
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidSessionId(id) {
  return typeof id === "string" && UUID_RE.test(id);
}

// src/client/session.ts
var SESSION_STORAGE_KEY = "pdf-studio-session-id";
function getSessionId() {
  let id = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!isValidSessionId(id)) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  }
  document.cookie = `${SESSION_COOKIE}=${id}; path=/; SameSite=Lax`;
  return id;
}
function sessionStorageKey(base2) {
  return `pdf-studio:${getSessionId()}:${base2}`;
}
function storeGet(base2) {
  return localStorage.getItem(sessionStorageKey(base2));
}
function storeSet(base2, value) {
  localStorage.setItem(sessionStorageKey(base2), value);
}
function apiFetch(input, init = {}) {
  const headers = new Headers(init.headers);
  headers.set(SESSION_HEADER, getSessionId());
  return fetch(input, { ...init, headers, credentials: "same-origin" });
}

// src/client/smartGuides.ts
var TOLERANCE = 4;
function computeSmartGuides(moving, siblings, pageWidth, pageHeight, excludeIds) {
  const targetsX = [0, pageWidth / 2, pageWidth];
  const targetsY = [0, pageHeight / 2, pageHeight];
  for (const el of siblings) {
    if (excludeIds.has(el.id)) continue;
    targetsX.push(el.x, el.x + el.width / 2, el.x + el.width);
    targetsY.push(el.y, el.y + el.height / 2, el.y + el.height);
  }
  const edgesX = [moving.x, moving.x + moving.width / 2, moving.x + moving.width];
  const edgesY = [moving.y, moving.y + moving.height / 2, moving.y + moving.height];
  let bestDx = 0;
  let bestDy = 0;
  let bestAbsDx = TOLERANCE + 1;
  let bestAbsDy = TOLERANCE + 1;
  let guideX = null;
  let guideY = null;
  for (const edge of edgesX) {
    for (const t of targetsX) {
      const d = t - edge;
      const ad = Math.abs(d);
      if (ad < bestAbsDx) {
        bestAbsDx = ad;
        bestDx = d;
        guideX = t;
      }
    }
  }
  for (const edge of edgesY) {
    for (const t of targetsY) {
      const d = t - edge;
      const ad = Math.abs(d);
      if (ad < bestAbsDy) {
        bestAbsDy = ad;
        bestDy = d;
        guideY = t;
      }
    }
  }
  const guides = [];
  let x = moving.x;
  let y = moving.y;
  if (bestAbsDx <= TOLERANCE && guideX !== null) {
    x += bestDx;
    guides.push({ axis: "x", position: guideX });
  }
  if (bestAbsDy <= TOLERANCE && guideY !== null) {
    y += bestDy;
    guides.push({ axis: "y", position: guideY });
  }
  return { x, y, guides };
}

// src/client/templates.ts
var TEMPLATE_LIST = [
  {
    id: "blank",
    name: "Blank A4",
    description: "Empty page to start from scratch"
  },
  {
    id: "invoice",
    name: "Invoice",
    description: "Simple invoice with header and totals"
  },
  {
    id: "letter",
    name: "Letter",
    description: "Formal letter with sender and body"
  },
  {
    id: "flyer",
    name: "Flyer",
    description: "Bold promo flyer with accent block"
  },
  {
    id: "cv",
    name: "CV / Resume",
    description: "Professional resume with sidebar"
  },
  {
    id: "report",
    name: "Report",
    description: "One-page report with sections"
  },
  {
    id: "certificate",
    name: "Certificate",
    description: "Award certificate with border"
  },
  {
    id: "menu",
    name: "Menu",
    description: "Restaurant menu with courses"
  },
  {
    id: "proposal",
    name: "Proposal",
    description: "Project proposal overview"
  }
];
function base(name, pageSize = "a4") {
  return {
    id: uid2(),
    name,
    pageSize,
    pageBackground: "#faf9f6",
    showGrid: false,
    pages: [blankPage()],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function invoiceTemplate() {
  const doc = base("Invoice");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 595, height: 90, fill: "#0f766e", strokeWidth: 0 }),
    createText(40, 28, {
      content: "INVOICE",
      fontSize: 28,
      fontWeight: "bold",
      color: "#ffffff",
      width: 200,
      height: 36
    }),
    createText(360, 32, {
      content: "No. 00123\nDue: 30 days",
      fontSize: 12,
      color: "#ecfdf5",
      width: 180,
      height: 40,
      align: "right"
    }),
    createText(40, 120, {
      content: "Bill to\nAcme Corp\n123 Market Street\nBerlin",
      fontSize: 12,
      width: 220,
      height: 80
    }),
    createText(40, 230, {
      content: "Description                          Qty    Price",
      fontSize: 11,
      fontWeight: "bold",
      width: 500,
      height: 20
    }),
    createLine(40, 255, { width: 515, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(40, 270, {
      content: "Design services                       1    \u20AC1,200\nHosting (annual)                      1      \u20AC240",
      fontSize: 12,
      width: 515,
      height: 50
    }),
    createLine(40, 340, { width: 515, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(340, 360, {
      content: "Subtotal          \u20AC1,440\nTax (19%)           \u20AC274\nTotal             \u20AC1,714",
      fontSize: 13,
      fontWeight: "bold",
      width: 215,
      height: 70,
      align: "right"
    }),
    createText(40, 760, {
      content: "Thank you for your business.",
      fontSize: 11,
      color: "#64748b",
      width: 300,
      height: 20
    })
  );
  return doc;
}
function letterTemplate() {
  const doc = base("Letter");
  const els = doc.pages[0].elements;
  els.push(
    createText(60, 60, {
      content: "Your Name\nyour@email.com\n+49 000 000000",
      fontSize: 11,
      color: "#475569",
      width: 220,
      height: 60
    }),
    createText(60, 160, {
      content: "Recipient Name\nCompany\nAddress line",
      fontSize: 12,
      width: 260,
      height: 60
    }),
    createText(60, 250, {
      content: (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }),
      fontSize: 12,
      width: 260,
      height: 24
    }),
    createText(60, 300, {
      content: "Dear Recipient,",
      fontSize: 14,
      width: 400,
      height: 24
    }),
    createText(60, 340, {
      content: "I am writing to follow up on our recent conversation. Please find the details below and let me know if you have any questions.\n\nI look forward to hearing from you.",
      fontSize: 13,
      width: 475,
      height: 140
    }),
    createText(60, 520, {
      content: "Kind regards,\nYour Name",
      fontSize: 13,
      width: 260,
      height: 50
    })
  );
  return doc;
}
function flyerTemplate() {
  const doc = base("Flyer");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 595, height: 842, fill: "#faf9f6", strokeWidth: 0 }),
    createRect(40, 40, {
      width: 515,
      height: 280,
      fill: "#0d9488",
      strokeWidth: 0,
      cornerRadius: 12
    }),
    createText(70, 100, {
      content: "Summer\nWorkshop",
      fontSize: 42,
      fontWeight: "bold",
      color: "#ffffff",
      width: 400,
      height: 110
    }),
    createText(70, 230, {
      content: "Design systems \xB7 Live demos \xB7 Networking",
      fontSize: 14,
      color: "#ccfbf1",
      width: 420,
      height: 28
    }),
    createText(70, 380, {
      content: "Saturday 10:00 \xB7 Studio Hall",
      fontSize: 20,
      fontWeight: "bold",
      width: 420,
      height: 32
    }),
    createText(70, 430, {
      content: "Join us for a hands-on session on building polished PDFs and print layouts. Beginners welcome.",
      fontSize: 14,
      color: "#334155",
      width: 450,
      height: 70
    }),
    createRect(70, 540, {
      width: 180,
      height: 48,
      fill: "#1a1a1a",
      strokeWidth: 0,
      cornerRadius: 8
    }),
    createText(70, 552, {
      content: "Reserve a seat",
      fontSize: 16,
      fontWeight: "bold",
      color: "#ffffff",
      width: 180,
      height: 28,
      align: "center"
    })
  );
  return doc;
}
function cvTemplate() {
  const doc = base("CV / Resume");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 200, height: 842, fill: "#0f766e", strokeWidth: 0 }),
    createText(28, 48, {
      content: "Alex Morgan",
      fontSize: 22,
      fontWeight: "bold",
      color: "#ffffff",
      width: 150,
      height: 56
    }),
    createText(28, 110, {
      content: "Product Designer",
      fontSize: 12,
      color: "#ccfbf1",
      width: 150,
      height: 24
    }),
    createText(28, 160, {
      content: "CONTACT",
      fontSize: 11,
      fontWeight: "bold",
      color: "#99f6e4",
      width: 150,
      height: 20
    }),
    createText(28, 185, {
      content: "alex@email.com\n+49 170 000000\nBerlin, DE\nlinkedin.com/in/alex",
      fontSize: 11,
      color: "#ecfdf5",
      width: 150,
      height: 90
    }),
    createText(28, 300, {
      content: "SKILLS",
      fontSize: 11,
      fontWeight: "bold",
      color: "#99f6e4",
      width: 150,
      height: 20
    }),
    createText(28, 325, {
      content: "UI / UX design\nFigma & prototyping\nDesign systems\nUser research\nHTML / CSS",
      fontSize: 11,
      color: "#ecfdf5",
      width: 150,
      height: 110
    }),
    createText(28, 460, {
      content: "LANGUAGES",
      fontSize: 11,
      fontWeight: "bold",
      color: "#99f6e4",
      width: 150,
      height: 20
    }),
    createText(28, 485, {
      content: "English \u2014 Fluent\nGerman \u2014 Intermediate",
      fontSize: 11,
      color: "#ecfdf5",
      width: 150,
      height: 50
    }),
    createText(230, 48, {
      content: "Profile",
      fontSize: 16,
      fontWeight: "bold",
      color: "#0f766e",
      width: 320,
      height: 28
    }),
    createLine(230, 78, { width: 320, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(230, 95, {
      content: "Product designer with 6+ years crafting clear interfaces and print-ready layouts. Focused on systems thinking and collaboration.",
      fontSize: 12,
      color: "#334155",
      width: 320,
      height: 70
    }),
    createText(230, 180, {
      content: "Experience",
      fontSize: 16,
      fontWeight: "bold",
      color: "#0f766e",
      width: 320,
      height: 28
    }),
    createLine(230, 210, { width: 320, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(230, 225, {
      content: "Senior Designer \u2014 Studio North",
      fontSize: 13,
      fontWeight: "bold",
      width: 320,
      height: 22
    }),
    createText(230, 248, {
      content: "2021 \u2014 Present",
      fontSize: 11,
      color: "#64748b",
      width: 320,
      height: 18
    }),
    createText(230, 270, {
      content: "Led redesign of client portals and established a shared component library used across three products.",
      fontSize: 12,
      color: "#334155",
      width: 320,
      height: 55
    }),
    createText(230, 340, {
      content: "Designer \u2014 Bright Labs",
      fontSize: 13,
      fontWeight: "bold",
      width: 320,
      height: 22
    }),
    createText(230, 363, {
      content: "2018 \u2014 2021",
      fontSize: 11,
      color: "#64748b",
      width: 320,
      height: 18
    }),
    createText(230, 385, {
      content: "Designed marketing sites and onboarding flows. Partnered with engineers on accessible UI patterns.",
      fontSize: 12,
      color: "#334155",
      width: 320,
      height: 55
    }),
    createText(230, 460, {
      content: "Education",
      fontSize: 16,
      fontWeight: "bold",
      color: "#0f766e",
      width: 320,
      height: 28
    }),
    createLine(230, 490, { width: 320, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(230, 505, {
      content: "B.A. Visual Communication\nBerlin University of the Arts \u2014 2018",
      fontSize: 12,
      width: 320,
      height: 45
    })
  );
  return doc;
}
function reportTemplate() {
  const doc = base("Report");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 595, height: 72, fill: "#0f766e", strokeWidth: 0 }),
    createText(40, 24, {
      content: "Quarterly Report",
      fontSize: 22,
      fontWeight: "bold",
      color: "#ffffff",
      width: 320,
      height: 32
    }),
    createText(380, 28, {
      content: "Q2 2026",
      fontSize: 14,
      color: "#ccfbf1",
      width: 170,
      height: 24,
      align: "right"
    }),
    createText(40, 100, {
      content: "Executive summary",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24
    }),
    createText(40, 130, {
      content: "Revenue grew 12% quarter over quarter. Retention improved after the onboarding redesign. Key risks remain around capacity and vendor costs.",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 55
    }),
    createRect(40, 200, {
      width: 155,
      height: 90,
      fill: "#ecfdf5",
      stroke: "#0d9488",
      strokeWidth: 1,
      cornerRadius: 8
    }),
    createText(50, 215, {
      content: "Revenue\n\u20AC248k\n+12% QoQ",
      fontSize: 13,
      fontWeight: "bold",
      color: "#0f766e",
      width: 135,
      height: 65
    }),
    createRect(220, 200, {
      width: 155,
      height: 90,
      fill: "#ecfdf5",
      stroke: "#0d9488",
      strokeWidth: 1,
      cornerRadius: 8
    }),
    createText(230, 215, {
      content: "Customers\n1,420\n+8% QoQ",
      fontSize: 13,
      fontWeight: "bold",
      color: "#0f766e",
      width: 135,
      height: 65
    }),
    createRect(400, 200, {
      width: 155,
      height: 90,
      fill: "#ecfdf5",
      stroke: "#0d9488",
      strokeWidth: 1,
      cornerRadius: 8
    }),
    createText(410, 215, {
      content: "NPS\n52\n+4 pts",
      fontSize: 13,
      fontWeight: "bold",
      color: "#0f766e",
      width: 135,
      height: 65
    }),
    createText(40, 320, {
      content: "Highlights",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24
    }),
    createLine(40, 348, { width: 515, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(40, 365, {
      content: "\u2022 Launched self-serve billing and reduced support tickets by 18%\n\u2022 Expanded team with two designers and one engineer\n\u2022 Pilot program with three enterprise accounts closed",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 70
    }),
    createText(40, 460, {
      content: "Next steps",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24
    }),
    createLine(40, 488, { width: 515, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(40, 505, {
      content: "1. Ship analytics dashboard for customer success\n2. Finalize Q3 hiring plan and budget\n3. Review vendor contracts before renewal",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 70
    }),
    createText(40, 780, {
      content: "Confidential \u2014 Internal use only",
      fontSize: 10,
      color: "#64748b",
      width: 515,
      height: 18
    })
  );
  return doc;
}
function certificateTemplate() {
  const doc = base("Certificate");
  const els = doc.pages[0].elements;
  els.push(
    createRect(28, 28, {
      width: 539,
      height: 786,
      fill: "#faf9f6",
      stroke: "#0f766e",
      strokeWidth: 3
    }),
    createRect(40, 40, {
      width: 515,
      height: 762,
      fill: "#faf9f6",
      stroke: "#0d9488",
      strokeWidth: 1
    }),
    createText(80, 120, {
      content: "CERTIFICATE OF COMPLETION",
      fontSize: 14,
      fontWeight: "bold",
      color: "#0f766e",
      width: 435,
      height: 28,
      align: "center",
      letterSpacing: 2
    }),
    createLine(180, 160, { width: 235, height: 0, stroke: "#0d9488", strokeWidth: 2 }),
    createText(80, 200, {
      content: "This is to certify that",
      fontSize: 14,
      color: "#64748b",
      width: 435,
      height: 24,
      align: "center"
    }),
    createText(80, 250, {
      content: "Jordan Lee",
      fontSize: 36,
      fontWeight: "bold",
      color: "#1a1a1a",
      width: 435,
      height: 48,
      align: "center"
    }),
    createText(80, 320, {
      content: "has successfully completed the program\nPDF Design Fundamentals",
      fontSize: 15,
      color: "#334155",
      width: 435,
      height: 50,
      align: "center"
    }),
    createRect(200, 400, {
      width: 195,
      height: 8,
      fill: "#0d9488",
      strokeWidth: 0,
      cornerRadius: 4
    }),
    createText(80, 440, {
      content: "Awarded on 18 July 2026",
      fontSize: 13,
      color: "#475569",
      width: 435,
      height: 24,
      align: "center"
    }),
    createLine(90, 620, { width: 160, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(90, 635, {
      content: "Director\nAlex Morgan",
      fontSize: 12,
      color: "#475569",
      width: 160,
      height: 40,
      align: "center"
    }),
    createLine(345, 620, { width: 160, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(345, 635, {
      content: "Instructor\nSam Rivera",
      fontSize: 12,
      color: "#475569",
      width: 160,
      height: 40,
      align: "center"
    }),
    createText(80, 720, {
      content: "PDF Studio Academy",
      fontSize: 12,
      fontWeight: "bold",
      color: "#0f766e",
      width: 435,
      height: 24,
      align: "center"
    })
  );
  return doc;
}
function menuTemplate() {
  const doc = base("Menu");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 595, height: 100, fill: "#0f766e", strokeWidth: 0 }),
    createText(40, 28, {
      content: "The Garden Table",
      fontSize: 26,
      fontWeight: "bold",
      color: "#ffffff",
      width: 400,
      height: 36
    }),
    createText(40, 68, {
      content: "Seasonal menu \xB7 Dinner",
      fontSize: 13,
      color: "#ccfbf1",
      width: 400,
      height: 22
    }),
    createText(40, 130, {
      content: "Starters",
      fontSize: 18,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 28
    }),
    createLine(40, 160, { width: 515, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(40, 180, {
      content: "Heirloom tomato salad",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22
    }),
    createText(430, 180, {
      content: "\u20AC12",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right"
    }),
    createText(40, 202, {
      content: "Basil oil, aged balsamic, grilled sourdough",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20
    }),
    createText(40, 240, {
      content: "Soup of the day",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22
    }),
    createText(430, 240, {
      content: "\u20AC9",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right"
    }),
    createText(40, 262, {
      content: "Ask your server for today's potage",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20
    }),
    createText(40, 320, {
      content: "Mains",
      fontSize: 18,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 28
    }),
    createLine(40, 350, { width: 515, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(40, 370, {
      content: "Herb-roasted chicken",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22
    }),
    createText(430, 370, {
      content: "\u20AC24",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right"
    }),
    createText(40, 392, {
      content: "Lemon thyme jus, roasted roots, greens",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20
    }),
    createText(40, 430, {
      content: "Grilled sea bass",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22
    }),
    createText(430, 430, {
      content: "\u20AC28",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right"
    }),
    createText(40, 452, {
      content: "Fennel salad, citrus beurre blanc",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20
    }),
    createText(40, 490, {
      content: "Mushroom risotto",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22
    }),
    createText(430, 490, {
      content: "\u20AC21",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right"
    }),
    createText(40, 512, {
      content: "Porcini, parmesan, chives  \xB7  vegetarian",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20
    }),
    createText(40, 570, {
      content: "Desserts",
      fontSize: 18,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 28
    }),
    createLine(40, 600, { width: 515, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(40, 620, {
      content: "Dark chocolate tart",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22
    }),
    createText(430, 620, {
      content: "\u20AC11",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right"
    }),
    createText(40, 642, {
      content: "Sea salt caramel, whipped cream",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20
    }),
    createText(40, 680, {
      content: "Seasonal fruit plate",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22
    }),
    createText(430, 680, {
      content: "\u20AC9",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right"
    }),
    createText(40, 780, {
      content: "Please inform us of any allergies.",
      fontSize: 11,
      color: "#64748b",
      width: 515,
      height: 20
    })
  );
  return doc;
}
function proposalTemplate() {
  const doc = base("Proposal");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 595, height: 110, fill: "#0f766e", strokeWidth: 0 }),
    createText(40, 30, {
      content: "Project Proposal",
      fontSize: 26,
      fontWeight: "bold",
      color: "#ffffff",
      width: 400,
      height: 36
    }),
    createText(40, 72, {
      content: "Website redesign for Acme Corp",
      fontSize: 14,
      color: "#ccfbf1",
      width: 400,
      height: 24
    }),
    createText(40, 140, {
      content: "Prepared for",
      fontSize: 11,
      fontWeight: "bold",
      color: "#0f766e",
      width: 240,
      height: 18
    }),
    createText(40, 160, {
      content: "Acme Corp\nJordan Lee, Marketing Lead",
      fontSize: 12,
      width: 240,
      height: 40
    }),
    createText(320, 140, {
      content: "Prepared by",
      fontSize: 11,
      fontWeight: "bold",
      color: "#0f766e",
      width: 230,
      height: 18
    }),
    createText(320, 160, {
      content: "PDF Studio\nAlex Morgan\n18 July 2026",
      fontSize: 12,
      width: 230,
      height: 55
    }),
    createLine(40, 230, { width: 515, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(40, 255, {
      content: "Overview",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24
    }),
    createText(40, 285, {
      content: "We propose a redesign of the marketing site to improve clarity, conversion, and brand consistency. Work includes discovery, wireframes, visual design, and handoff.",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 60
    }),
    createText(40, 360, {
      content: "Scope",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24
    }),
    createText(40, 390, {
      content: "\u2022 Home, product, pricing, and about pages\n\u2022 Responsive layouts for desktop and mobile\n\u2022 Component library for future pages\n\u2022 Two rounds of revisions included",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 80
    }),
    createText(40, 490, {
      content: "Timeline & investment",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24
    }),
    createRect(40, 525, {
      width: 250,
      height: 100,
      fill: "#ecfdf5",
      stroke: "#0d9488",
      strokeWidth: 1,
      cornerRadius: 8
    }),
    createText(55, 545, {
      content: "Timeline\n6 weeks\nKickoff \u2192 launch",
      fontSize: 13,
      fontWeight: "bold",
      color: "#0f766e",
      width: 220,
      height: 70
    }),
    createRect(305, 525, {
      width: 250,
      height: 100,
      fill: "#ecfdf5",
      stroke: "#0d9488",
      strokeWidth: 1,
      cornerRadius: 8
    }),
    createText(320, 545, {
      content: "Investment\n\u20AC8,400\nFixed project fee",
      fontSize: 13,
      fontWeight: "bold",
      color: "#0f766e",
      width: 220,
      height: 70
    }),
    createText(40, 660, {
      content: "Next step",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24
    }),
    createText(40, 690, {
      content: "Approve this proposal and we will schedule a kickoff within five business days.",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 40
    }),
    createText(40, 780, {
      content: "Valid for 30 days from the date above.",
      fontSize: 10,
      color: "#64748b",
      width: 515,
      height: 18
    })
  );
  return doc;
}
function buildTemplate(id) {
  switch (id) {
    case "invoice":
      return invoiceTemplate();
    case "letter":
      return letterTemplate();
    case "flyer":
      return flyerTemplate();
    case "cv":
      return cvTemplate();
    case "report":
      return reportTemplate();
    case "certificate":
      return certificateTemplate();
    case "menu":
      return menuTemplate();
    case "proposal":
      return proposalTemplate();
    default:
      return base("Untitled document");
  }
}

// src/client/main.ts
var STORAGE_KEY = "doc";
var DOCS_INDEX_KEY = "docs";
var THEME_KEY = "pdf-studio-theme";
var SETTINGS_KEY = "settings";
var FAV_KEY = "favorites";
var RECENT_KEY = "recent";
var BRAND_KEY = "brand";
var EXPORT_KEY = "export";
var AUTHOR_KEY = "author";
var docKey = (id) => `doc:${id}`;
function normalizeTextElement(el) {
  if (el.type !== "text") return el;
  const t = el;
  let fontFamily = t.fontFamily || "Helvetica";
  if (typeof fontFamily === "string" && fontFamily.startsWith("custom:")) {
    fontFamily = "Helvetica";
  }
  return {
    ...t,
    fontFamily,
    fontStyle: t.fontStyle ?? "normal",
    underline: t.underline ?? false,
    lineHeight: t.lineHeight ?? 1.25,
    letterSpacing: t.letterSpacing ?? 0,
    listStyle: t.listStyle ?? "none"
  };
}
function normalizeDoc(doc) {
  return {
    ...doc,
    pageBackground: doc.pageBackground || "#faf9f6",
    guides: doc.guides || [],
    comments: doc.comments || [],
    customFonts: doc.customFonts || [],
    master: doc.master || { header: [], footer: [] },
    watermark: doc.watermark ?? null,
    pages: doc.pages.map((p) => ({
      ...p,
      applyMaster: p.applyMaster !== false,
      elements: p.elements.map(normalizeTextElement)
    }))
  };
}
function trimSignatureCanvas(source) {
  const ctx = source.getContext("2d");
  if (!ctx) return source;
  const { width, height } = source;
  const { data: data2 } = ctx.getImageData(0, 0, width, height);
  let top = height;
  let left = width;
  let right = 0;
  let bottom = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data2[(y * width + x) * 4 + 3] > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < left || bottom < top) return source;
  const pad = Math.round(Math.min(width, height) * 0.04);
  left = Math.max(0, left - pad);
  top = Math.max(0, top - pad);
  right = Math.min(width - 1, right + pad);
  bottom = Math.min(height - 1, bottom + pad);
  const w = right - left + 1;
  const h = bottom - top + 1;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const outCtx = out.getContext("2d");
  if (!outCtx) return source;
  outCtx.drawImage(source, left, top, w, h, 0, 0, w, h);
  return out;
}
function pdfEditor() {
  const history = new HistoryStack();
  let persistTimer = null;
  let skipHistory = false;
  let clipboard = [];
  let spaceDown = false;
  return {
    doc: defaultDoc(),
    activePageIndex: 0,
    selectedIds: [],
    tool: "select",
    zoom: 0.85,
    panX: 0,
    panY: 0,
    exporting: false,
    editingTextId: null,
    drag: null,
    smartGuides: [],
    marquee: null,
    showTemplates: false,
    showLibrary: true,
    leftRail: "insert",
    showExportModal: false,
    showSignatureModal: false,
    showFindReplace: false,
    showBrandKit: false,
    showDocLibrary: false,
    showComments: false,
    editingMaster: false,
    reviewMode: false,
    libraryCategory: "all",
    libraryItems: LIBRARY_ITEMS,
    libraryCategories: LIBRARY_CATEGORIES,
    libraryQuery: "",
    libraryView: "list",
    libraryKeepPlacing: false,
    favorites: [],
    recentIds: [],
    pendingLibraryKind: null,
    placeHint: false,
    signatureTab: "draw",
    signatureInk: "#1a1a1a",
    signatureTyped: "",
    signatureBusy: false,
    signatureHasInk: false,
    signaturePlace: null,
    signatureReplaceId: null,
    templates: TEMPLATE_LIST,
    snapEnabled: true,
    canUndo: false,
    canRedo: false,
    justInsertedId: null,
    theme: "dark",
    showSettings: false,
    showFileMenu: false,
    showGuides: false,
    showGrid: false,
    showRulers: true,
    fontOptions: allFontOptions(),
    findQuery: "",
    replaceQuery: "",
    findMatches: [],
    findIndex: -1,
    brand: {
      colors: ["#0d9488", "#0f766e", "#1a1a1a", "#faf9f6"],
      logoUrl: "",
      logoName: "",
      defaultFont: "Helvetica",
      name: "My Brand"
    },
    exportSettings: {
      margin: 0,
      imageQuality: 0.85,
      flatten: false,
      pdfaLite: false
    },
    authorName: "Reviewer",
    docLibrary: [],
    commentDraft: "",
    get selectedId() {
      return this.selectedIds[0] ?? null;
    },
    set selectedId(id) {
      this.selectedIds = id ? [id] : [];
    },
    get pageSize() {
      return PAGE_SIZES[this.doc.pageSize] ?? PAGE_SIZES.a4;
    },
    get activePage() {
      return this.doc.pages[this.activePageIndex] ?? this.doc.pages[0];
    },
    get selected() {
      if (!this.selectedIds.length) return null;
      return this.workingElements.find((e) => e.id === this.selectedIds[0]) ?? null;
    },
    get selectedElements() {
      return this.workingElements.filter((e) => this.selectedIds.includes(e.id));
    },
    get selectedIndex() {
      if (!this.selectedIds.length) return -1;
      return this.workingElements.findIndex((e) => e.id === this.selectedIds[0]);
    },
    get layers() {
      return [...this.workingElements].reverse().map((el) => ({
        id: el.id,
        label: elementLabel(el),
        type: el.type,
        locked: el.locked,
        groupId: el.groupId
      }));
    },
    get pageComments() {
      return (this.doc.comments || []).filter((c) => c.pageId === this.activePage.id);
    },
    get filteredLibrary() {
      let items = this.libraryItems;
      if (this.libraryCategory === "favorites") {
        items = items.filter((i) => this.favorites.includes(i.id));
      } else if (this.libraryCategory === "recent") {
        items = this.recentIds.map((id) => this.libraryItems.find((i) => i.id === id)).filter(Boolean);
      } else if (this.libraryCategory !== "all") {
        items = items.filter((i) => i.category === this.libraryCategory);
      }
      return items.filter((i) => matchesLibraryQuery(i, this.libraryQuery));
    },
    get pageStyle() {
      const { width, height } = this.pageSize;
      return {
        width: `${width * this.zoom}px`,
        height: `${height * this.zoom}px`,
        backgroundColor: this.doc.pageBackground || "#faf9f6",
        transform: `translate(${this.panX}px, ${this.panY}px)`
      };
    },
    get viewportStyle() {
      return {
        cursor: spaceDown || this.drag?.mode === "pan" ? "grab" : void 0
      };
    },
    get pageThumbStyle() {
      const { width, height } = this.pageSize;
      return { aspectRatio: `${width} / ${height}` };
    },
    get workingElements() {
      if (this.editingMaster) {
        return this.doc.master?.header || [];
      }
      return this.activePage.elements;
    },
    get displayElements() {
      return this.workingElements;
    },
    get masterPreviewElements() {
      if (this.editingMaster) return [];
      if (this.activePage.applyMaster === false) return [];
      return [...this.doc.master?.header || [], ...this.doc.master?.footer || []];
    },
    init() {
      getSessionId();
      const params = new URLSearchParams(window.location.search);
      const templateId = params.get("template");
      const fresh = params.get("new") === "1";
      const openId = params.get("doc");
      const savedTheme = localStorage.getItem(THEME_KEY);
      this.theme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : document.documentElement.getAttribute("data-theme") || "dark";
      this.applyTheme(this.theme);
      try {
        const settings = JSON.parse(storeGet(SETTINGS_KEY) || "{}");
        if (typeof settings.showGuides === "boolean") this.showGuides = settings.showGuides;
        if (typeof settings.showGrid === "boolean") this.showGrid = settings.showGrid;
        if (typeof settings.snapEnabled === "boolean") this.snapEnabled = settings.snapEnabled;
        if (typeof settings.showRulers === "boolean") this.showRulers = settings.showRulers;
      } catch {
      }
      try {
        this.favorites = JSON.parse(storeGet(FAV_KEY) || "[]");
        this.recentIds = JSON.parse(storeGet(RECENT_KEY) || "[]");
      } catch {
        this.favorites = [];
        this.recentIds = [];
      }
      try {
        const brand = JSON.parse(storeGet(BRAND_KEY) || "null");
        if (brand) this.brand = { ...this.brand, ...brand };
      } catch {
      }
      try {
        const exp = JSON.parse(storeGet(EXPORT_KEY) || "null");
        if (exp) this.exportSettings = { ...this.exportSettings, ...exp };
      } catch {
      }
      this.authorName = storeGet(AUTHOR_KEY) || "Reviewer";
      this.refreshDocLibrary();
      if (templateId) {
        this.doc = normalizeDoc(buildTemplate(templateId));
        this.commit(true);
      } else if (fresh) {
        this.doc = normalizeDoc(defaultDoc());
        this.commit(true);
      } else if (openId) {
        const saved = storeGet(docKey(openId));
        if (saved) {
          try {
            this.doc = normalizeDoc(JSON.parse(saved));
          } catch {
            this.doc = normalizeDoc(defaultDoc());
          }
        }
      } else {
        const saved = storeGet(STORAGE_KEY);
        if (saved) {
          try {
            this.doc = normalizeDoc(JSON.parse(saved));
          } catch {
            this.doc = normalizeDoc(defaultDoc());
          }
        } else {
          this.doc = normalizeDoc(defaultDoc());
        }
      }
      if (typeof this.doc.showGrid === "boolean") this.showGrid = this.doc.showGrid;
      this.fontOptions = allFontOptions();
      history.reset(this.doc);
      this.syncHistoryFlags();
      window.addEventListener("mousemove", (e) => this.onMouseMove(e));
      window.addEventListener("mouseup", () => this.onMouseUp());
      window.addEventListener("keydown", (e) => {
        if (e.code === "Space" && !e.target?.isContentEditable) {
          spaceDown = true;
        }
      });
      window.addEventListener("keyup", (e) => {
        if (e.code === "Space") spaceDown = false;
      });
      queueMicrotask(() => {
        const viewport = this.$el?.querySelector(".canvas-workspace");
        viewport?.addEventListener(
          "wheel",
          (e) => {
            const ev = e;
            if (ev.metaKey || ev.ctrlKey) {
              ev.preventDefault();
              this.onViewportWheel(ev);
            }
          },
          { passive: false }
        );
      });
    },
    applyTheme(theme) {
      this.theme = theme;
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem(THEME_KEY, theme);
    },
    toggleTheme() {
      this.applyTheme(this.theme === "dark" ? "light" : "dark");
    },
    saveSettings() {
      storeSet(
        SETTINGS_KEY,
        JSON.stringify({
          showGuides: this.showGuides,
          showGrid: this.showGrid,
          snapEnabled: this.snapEnabled,
          showRulers: this.showRulers
        })
      );
      this.doc.showGrid = this.showGrid;
      this.commit(false);
    },
    syncHistoryFlags() {
      this.canUndo = history.canUndo;
      this.canRedo = history.canRedo;
    },
    commit(recordHistory = true) {
      this.doc.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (recordHistory && !skipHistory) {
        history.push(this.doc);
        this.syncHistoryFlags();
      }
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(() => {
        try {
          storeSet(STORAGE_KEY, JSON.stringify(this.doc));
          storeSet(docKey(this.doc.id), JSON.stringify(this.doc));
          this.upsertDocLibrary();
        } catch (err) {
          console.warn("Could not persist document", err);
        }
      }, 180);
    },
    persist() {
      this.commit(true);
    },
    persistSoft() {
      this.commit(false);
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(() => {
        storeSet(STORAGE_KEY, JSON.stringify(this.doc));
        storeSet(docKey(this.doc.id), JSON.stringify(this.doc));
        this.upsertDocLibrary();
      }, 120);
    },
    refreshDocLibrary() {
      try {
        this.docLibrary = JSON.parse(storeGet(DOCS_INDEX_KEY) || "[]");
      } catch {
        this.docLibrary = [];
      }
    },
    upsertDocLibrary() {
      const entry = {
        id: this.doc.id,
        name: this.doc.name,
        updatedAt: this.doc.updatedAt
      };
      const list = this.docLibrary.filter((d) => d.id !== this.doc.id);
      list.unshift(entry);
      this.docLibrary = list.slice(0, 40);
      storeSet(DOCS_INDEX_KEY, JSON.stringify(this.docLibrary));
    },
    openDocFromLibrary(id) {
      const raw2 = storeGet(docKey(id));
      if (!raw2) return;
      try {
        this.doc = normalizeDoc(JSON.parse(raw2));
        this.activePageIndex = 0;
        this.selectedIds = [];
        history.reset(this.doc);
        this.syncHistoryFlags();
        this.showDocLibrary = false;
        this.fontOptions = allFontOptions();
        storeSet(STORAGE_KEY, JSON.stringify(this.doc));
      } catch {
        alert("Could not open document.");
      }
    },
    duplicateDocInLibrary() {
      const copy = structuredClone(this.doc);
      copy.id = uid2();
      copy.name = `${this.doc.name} copy`;
      copy.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.doc = normalizeDoc(copy);
      history.reset(this.doc);
      this.syncHistoryFlags();
      this.commit(false);
    },
    downloadStudioJson() {
      const blob = new Blob([JSON.stringify(this.doc, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${this.doc.name.replace(/[^\w.-]+/g, "_") || "document"}.pdfstudio.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    async onStudioJsonSelected(event) {
      const input = event.target;
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        this.doc = normalizeDoc(JSON.parse(text));
        this.activePageIndex = 0;
        this.selectedIds = [];
        history.reset(this.doc);
        this.syncHistoryFlags();
        this.fontOptions = allFontOptions();
        this.commit(false);
      } catch {
        alert("Invalid .pdfstudio.json file");
      } finally {
        input.value = "";
      }
    },
    undo() {
      const prev = history.undo(this.doc);
      if (!prev) return;
      skipHistory = true;
      this.doc = normalizeDoc(prev);
      this.selectedIds = [];
      this.syncHistoryFlags();
      storeSet(STORAGE_KEY, JSON.stringify(this.doc));
      skipHistory = false;
    },
    redo() {
      const next = history.redo(this.doc);
      if (!next) return;
      skipHistory = true;
      this.doc = normalizeDoc(next);
      this.selectedIds = [];
      this.syncHistoryFlags();
      storeSet(STORAGE_KEY, JSON.stringify(this.doc));
      skipHistory = false;
    },
    newDocument() {
      if (!confirm("Start a blank document? Unsaved changes stay in browser history only.")) return;
      this.doc = normalizeDoc(defaultDoc());
      this.activePageIndex = 0;
      this.selectedIds = [];
      history.reset(this.doc);
      this.syncHistoryFlags();
      this.commit(false);
    },
    applyTemplate(id) {
      this.doc = normalizeDoc(buildTemplate(id));
      this.activePageIndex = 0;
      this.selectedIds = [];
      this.showTemplates = false;
      history.reset(this.doc);
      this.syncHistoryFlags();
      this.commit(false);
    },
    setActivePage(index) {
      this.activePageIndex = index;
      this.selectedIds = [];
      this.editingTextId = null;
    },
    addPage() {
      this.doc.pages.push(blankPage());
      this.activePageIndex = this.doc.pages.length - 1;
      this.selectedIds = [];
      this.commit();
    },
    duplicatePage(index) {
      const source = this.doc.pages[index];
      if (!source) return;
      const copy = {
        id: uid2(),
        applyMaster: source.applyMaster,
        elements: source.elements.map((el) => {
          const c = structuredClone(el);
          c.id = uid2();
          return c;
        })
      };
      this.doc.pages.splice(index + 1, 0, copy);
      this.activePageIndex = index + 1;
      this.selectedIds = [];
      this.commit();
    },
    movePage(index, dir) {
      const next = index + dir;
      if (next < 0 || next >= this.doc.pages.length) return;
      const pages = this.doc.pages;
      [pages[index], pages[next]] = [pages[next], pages[index]];
      this.activePageIndex = next;
      this.commit();
    },
    removePage(index) {
      if (this.doc.pages.length <= 1) return;
      this.doc.pages.splice(index, 1);
      this.activePageIndex = Math.min(this.activePageIndex, this.doc.pages.length - 1);
      this.selectedIds = [];
      this.commit();
    },
    zoomIn() {
      this.zoom = Math.min(2.5, Math.round((this.zoom + 0.1) * 10) / 10);
    },
    zoomOut() {
      this.zoom = Math.max(0.25, Math.round((this.zoom - 0.1) * 10) / 10);
    },
    fitWidth() {
      const pad = 160;
      const avail = Math.max(280, window.innerWidth - 420 - pad);
      this.zoom = Math.min(1.5, Math.max(0.3, Math.round(avail / this.pageSize.width * 100) / 100));
      this.panX = 0;
      this.panY = 0;
    },
    fitPage() {
      const padX = 160;
      const padY = 180;
      const availW = Math.max(280, window.innerWidth - 420 - padX);
      const availH = Math.max(280, window.innerHeight - padY);
      const zx = availW / this.pageSize.width;
      const zy = availH / this.pageSize.height;
      this.zoom = Math.min(1.5, Math.max(0.3, Math.round(Math.min(zx, zy) * 100) / 100));
      this.panX = 0;
      this.panY = 0;
    },
    fitZoom() {
      this.fitWidth();
    },
    onViewportWheel(event) {
      if (!(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.08 : 0.08;
      this.zoom = Math.min(2.5, Math.max(0.25, Math.round((this.zoom + delta) * 100) / 100));
    },
    pageCoords(event) {
      const page = this.$refs.page;
      const rect = page.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / this.zoom,
        y: (event.clientY - rect.top) / this.zoom
      };
    },
    snap(value) {
      if (!this.snapEnabled) return Math.round(value);
      const guides = this.doc.guides || [];
      for (const g of guides) {
        if (Math.abs(g.position - value) <= 4) return g.position;
      }
      return Math.round(value / 8) * 8;
    },
    isSelected(id) {
      return this.selectedIds.includes(id);
    },
    selectElement(el, additive = false) {
      const groupMembers = el.groupId ? this.workingElements.filter((e) => e.groupId === el.groupId).map((e) => e.id) : [el.id];
      if (additive) {
        const set3 = new Set(this.selectedIds);
        for (const id of groupMembers) {
          if (set3.has(id)) set3.delete(id);
          else set3.add(id);
        }
        this.selectedIds = [...set3];
      } else {
        this.selectedIds = groupMembers;
      }
    },
    onCanvasBackground(event) {
      if (event.target === event.currentTarget) {
        if (spaceDown || event.button === 1) return;
        this.selectedIds = [];
        this.editingTextId = null;
      }
    },
    onViewportMouseDown(event) {
      if (event.button === 1 || event.button === 0 && spaceDown) {
        event.preventDefault();
        this.drag = {
          mode: "pan",
          startX: event.clientX,
          startY: event.clientY,
          origPanX: this.panX,
          origPanY: this.panY
        };
      }
    },
    onPageMouseDown(event) {
      if (event.button !== 0 || spaceDown) return;
      const { x, y } = this.pageCoords(event);
      const sx = this.snap(x);
      const sy = this.snap(y);
      if (this.tool === "comment" || this.reviewMode) {
        this.addCommentAt(sx, sy);
        return;
      }
      if (this.tool === "place" && this.pendingLibraryKind) {
        this.insertLibraryAt(this.pendingLibraryKind, sx, sy);
        return;
      }
      if (this.tool === "select") {
        this.drag = {
          mode: "marquee",
          startX: x,
          startY: y,
          x,
          y,
          w: 0,
          h: 0
        };
        if (!event.shiftKey) {
          this.selectedIds = [];
          this.editingTextId = null;
        }
        return;
      }
      let el;
      if (this.tool === "text") el = createText(sx, sy, { fontFamily: this.brand.defaultFont || "Helvetica" });
      else if (this.tool === "rect") el = createRect(sx, sy);
      else if (this.tool === "ellipse") el = createEllipse(sx, sy);
      else el = createLine(sx, sy);
      this.pushElement(el);
    },
    pushElement(el) {
      if (this.editingMaster) {
        if (!this.doc.master) this.doc.master = { header: [], footer: [] };
        this.doc.master.header.push(el);
      } else {
        this.activePage.elements.push(el);
      }
      this.selectedIds = [el.id];
      this.justInsertedId = el.id;
      if (!this.libraryKeepPlacing) {
        this.tool = "select";
        this.pendingLibraryKind = null;
        this.placeHint = false;
      }
      this.commit();
      setTimeout(() => {
        if (this.justInsertedId === el.id) this.justInsertedId = null;
      }, 480);
      if (!this.libraryKeepPlacing && (el.type === "text" || el.type === "sticky")) {
        queueMicrotask(() => this.startTextEdit(el));
      }
    },
    rememberLibraryUse(item) {
      this.recentIds = [item.id, ...this.recentIds.filter((id) => id !== item.id)].slice(0, 16);
      storeSet(RECENT_KEY, JSON.stringify(this.recentIds));
    },
    isFavorite(id) {
      return this.favorites.includes(id);
    },
    toggleFavorite(id) {
      if (this.favorites.includes(id)) {
        this.favorites = this.favorites.filter((f) => f !== id);
      } else {
        this.favorites = [id, ...this.favorites].slice(0, 40);
      }
      storeSet(FAV_KEY, JSON.stringify(this.favorites));
    },
    pickLibraryItem(item) {
      this.rememberLibraryUse(item);
      if (item.kind === "image") {
        this.$refs.imageInput.click();
        return;
      }
      if (item.kind === "signature") {
        this.openSignatureModal();
        return;
      }
      this.pendingLibraryKind = item.kind;
      this.tool = "place";
      this.placeHint = true;
      this.selectedIds = [];
    },
    insertLibraryQuick(item) {
      this.rememberLibraryUse(item);
      if (item.kind === "image") {
        this.$refs.imageInput.click();
        return;
      }
      if (item.kind === "signature") {
        this.openSignatureModal();
        return;
      }
      const { width, height } = this.pageSize;
      const el = createFromLibrary(item.kind, width / 2 - 80, height / 2 - 40);
      if (el === "image" || el === "signature") return;
      el.x = this.snap(Math.max(24, width / 2 - el.width / 2));
      el.y = this.snap(Math.max(24, height / 2 - el.height / 2));
      this.pushElement(el);
    },
    insertLibraryAt(kind, x, y) {
      const el = createFromLibrary(kind, x, y);
      if (el === "image") {
        this.$refs.imageInput.click();
        return;
      }
      if (el === "signature") {
        this.openSignatureModal(x, y);
        return;
      }
      this.pushElement(el);
    },
    insertFormField(kind) {
      const { width, height } = this.pageSize;
      const x = this.snap(width / 2 - 90);
      const y = this.snap(height / 2 - 20);
      const el = kind === "formText" ? createFormText(x, y) : kind === "formCheck" ? createFormCheck(x, y) : createFormSelect(x, y);
      this.pushElement(el);
    },
    onElementMouseDown(event, el) {
      if (event.button !== 0 || spaceDown) return;
      if (this.editingMaster) {
      }
      this.selectElement(el, event.shiftKey);
      if (el.locked) return;
      const ids = this.selectedIds.filter((id) => {
        const e = this.workingElements.find((x) => x.id === id);
        return e && !e.locked;
      });
      this.drag = {
        mode: "move",
        ids,
        startX: event.clientX,
        startY: event.clientY,
        origins: ids.map((id) => {
          const e = this.workingElements.find((x) => x.id === id);
          return { id, x: e.x, y: e.y };
        })
      };
    },
    startResize(event, el) {
      if (el.locked) return;
      this.drag = {
        mode: "resize",
        id: el.id,
        startX: event.clientX,
        startY: event.clientY,
        origW: el.width,
        origH: el.height
      };
    },
    onMouseMove(event) {
      if (!this.drag) return;
      if (this.drag.mode === "pan") {
        this.panX = this.drag.origPanX + (event.clientX - this.drag.startX);
        this.panY = this.drag.origPanY + (event.clientY - this.drag.startY);
        return;
      }
      if (this.drag.mode === "marquee") {
        const { x, y } = this.pageCoords(event);
        const x0 = Math.min(this.drag.startX, x);
        const y0 = Math.min(this.drag.startY, y);
        const w = Math.abs(x - this.drag.startX);
        const h = Math.abs(y - this.drag.startY);
        this.drag = { ...this.drag, x: x0, y: y0, w, h };
        this.marquee = { x: x0, y: y0, w, h };
        return;
      }
      if (this.drag.mode === "guide") {
        const guideDrag = this.drag;
        const { x, y } = this.pageCoords(event);
        const g = (this.doc.guides || []).find((g2) => g2.id === guideDrag.id);
        if (g) {
          g.position = guideDrag.axis === "x" ? this.snap(x) : this.snap(y);
        }
        return;
      }
      if (this.drag.mode === "resize") {
        const resizeDrag = this.drag;
        const el = this.workingElements.find((e) => e.id === resizeDrag.id);
        if (!el) return;
        const dx = (event.clientX - resizeDrag.startX) / this.zoom;
        const dy = (event.clientY - resizeDrag.startY) / this.zoom;
        el.width = Math.max(20, this.snap(resizeDrag.origW + dx));
        el.height = Math.max(el.type === "line" ? 0 : 20, this.snap(resizeDrag.origH + dy));
        return;
      }
      if (this.drag.mode === "move") {
        const dx = (event.clientX - this.drag.startX) / this.zoom;
        const dy = (event.clientY - this.drag.startY) / this.zoom;
        const exclude = new Set(this.drag.ids);
        const primary = this.drag.origins[0];
        if (!primary) return;
        const primaryEl = this.workingElements.find((e) => e.id === primary.id);
        if (!primaryEl) return;
        let nx = this.snap(primary.x + dx);
        let ny = this.snap(primary.y + dy);
        if (this.snapEnabled) {
          const result = computeSmartGuides(
            { x: nx, y: ny, width: primaryEl.width, height: primaryEl.height },
            this.workingElements,
            this.pageSize.width,
            this.pageSize.height,
            exclude
          );
          nx = result.x;
          ny = result.y;
          this.smartGuides = result.guides;
        } else {
          this.smartGuides = [];
        }
        const odx = nx - primary.x;
        const ody = ny - primary.y;
        for (const origin of this.drag.origins) {
          const el = this.workingElements.find((e) => e.id === origin.id);
          if (!el || el.locked) continue;
          el.x = origin.x + odx;
          el.y = origin.y + ody;
        }
      }
    },
    onMouseUp() {
      if (!this.drag) return;
      if (this.drag.mode === "marquee") {
        const box = this.marquee;
        if (box && box.w > 4 && box.h > 4) {
          const hits = this.workingElements.filter(
            (el) => el.x < box.x + box.w && el.x + el.width > box.x && el.y < box.y + box.h && el.y + el.height > box.y
          ).map((el) => el.id);
          this.selectedIds = [.../* @__PURE__ */ new Set([...this.selectedIds, ...hits])];
        }
        this.marquee = null;
        this.drag = null;
        return;
      }
      if (this.drag.mode === "move" || this.drag.mode === "resize" || this.drag.mode === "guide") {
        this.drag = null;
        this.smartGuides = [];
        this.commit();
        return;
      }
      this.drag = null;
      this.smartGuides = [];
    },
    elementStyle(el) {
      const rotating = el.rotation ? `rotate(${el.rotation}deg)` : "";
      return {
        left: `${el.x * this.zoom}px`,
        top: `${el.y * this.zoom}px`,
        width: `${Math.max(el.width, 1) * this.zoom}px`,
        height: `${Math.max(el.height, el.type === "line" || el.type === "divider" || el.type === "arrow" ? 8 : 1) * this.zoom}px`,
        opacity: String(el.opacity),
        transform: rotating || void 0,
        cursor: el.locked ? "not-allowed" : this.tool === "place" ? "crosshair" : "move"
      };
    },
    iconHtml(el) {
      if (el.type !== "icon") return "";
      return iconSvg(el.icon, el.color, Math.min(el.width, el.height) * this.zoom);
    },
    previewText(content) {
      return content.replace(/\{\{page\}\}/g, String(this.activePageIndex + 1)).replace(/\{\{pages\}\}/g, String(this.doc.pages.length));
    },
    displayTextContent(el) {
      let content = this.previewText(el.content || "");
      if (el.listStyle === "bullet") {
        content = content.split("\n").map((l) => l.trim() ? `\u2022 ${l}` : l).join("\n");
      } else if (el.listStyle === "number") {
        let n = 1;
        content = content.split("\n").map((l) => l.trim() ? `${n++}. ${l}` : l).join("\n");
      }
      return content;
    },
    textInnerStyle(el) {
      return {
        fontSize: `${el.fontSize * this.zoom}px`,
        fontFamily: fontCssFamily(el.fontFamily),
        fontWeight: el.fontWeight,
        fontStyle: el.fontStyle || "normal",
        textDecoration: el.underline ? "underline" : "none",
        letterSpacing: `${(el.letterSpacing || 0) * this.zoom}px`,
        lineHeight: String(el.lineHeight || 1.25),
        color: el.color,
        textAlign: el.align
      };
    },
    shapeStyle(el) {
      const radius = el.type === "ellipse" ? "50%" : `${(el.cornerRadius || 0) * this.zoom}px`;
      return {
        backgroundColor: el.fill,
        border: el.strokeWidth > 0 ? `${el.strokeWidth * this.zoom}px solid ${el.stroke}` : "none",
        boxSizing: "border-box",
        borderRadius: radius
      };
    },
    thumbElementStyle(el) {
      return `left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${Math.max(el.height, 2)}px;opacity:${el.opacity};`;
    },
    thumbPreview(el) {
      if (el.type === "text" || el.type === "sticky") {
        return `<span style="font-size:${el.fontSize}px;color:${el.color};background:${el.type === "sticky" ? el.fill : "transparent"}">${escapeHtml(el.content.slice(0, 28))}</span>`;
      }
      if (el.type === "image" || el.type === "signature") {
        return `<img src="${el.src}" style="width:100%;height:100%;object-fit:contain" />`;
      }
      if (el.type === "line" || el.type === "divider" || el.type === "arrow") {
        return `<svg width="100%" height="100%" style="overflow:visible"><line x1="0" y1="50%" x2="100%" y2="50%" stroke="${"stroke" in el ? el.stroke : "#333"}" stroke-width="2"/></svg>`;
      }
      if (el.type === "badge" || el.type === "stamp") {
        return `<span style="color:${el.color};font-size:10px;font-weight:bold">${escapeHtml(el.label)}</span>`;
      }
      if (el.type === "checkbox" || el.type === "formCheck") {
        return `<span style="font-size:10px">${"checked" in el && el.checked ? "\u2611" : "\u2610"} ${escapeHtml(("label" in el ? el.label : "").slice(0, 16))}</span>`;
      }
      if (el.type === "formText" || el.type === "formSelect") {
        return `<span style="font-size:10px;border:1px solid #94a3b8;padding:2px">${escapeHtml(el.name)}</span>`;
      }
      if (el.type === "icon") {
        return iconSvg(el.icon, el.color, 16);
      }
      if (el.type === "table") {
        return `<div style="width:100%;height:100%;background:#e2e8f0;border:1px solid #94a3b8"></div>`;
      }
      if (el.type === "rect" || el.type === "ellipse") {
        const radius = el.type === "ellipse" ? "50%" : `${el.cornerRadius || 0}px`;
        return `<div style="width:100%;height:100%;background:${el.fill};border-radius:${radius}"></div>`;
      }
      return "";
    },
    startTextEdit(el) {
      this.editingTextId = el.id;
      this.selectedIds = [el.id];
    },
    finishTextEdit(event, el) {
      const target = event.target;
      el.content = target.innerText;
      this.editingTextId = null;
      this.commit();
    },
    updateTableCell(row, col, value) {
      const el = this.selected;
      if (!el || el.type !== "table") return;
      const idx = row * el.cols + col;
      el.cells[idx] = value;
      this.persistSoft();
    },
    copySelected() {
      const els = this.selectedElements;
      if (!els.length) return;
      clipboard = els.map((el) => structuredClone(el));
      try {
        void navigator.clipboard.writeText(JSON.stringify({ type: "pdf-studio-elements", elements: clipboard }));
      } catch {
      }
    },
    cutSelected() {
      this.copySelected();
      this.deleteSelected();
    },
    pasteClipboard() {
      if (!clipboard.length) return;
      const copies = clipboard.map((el) => cloneElement(el, 20));
      for (const c of copies) {
        c.groupId = void 0;
        if (this.editingMaster) {
          if (!this.doc.master) this.doc.master = { header: [], footer: [] };
          this.doc.master.header.push(c);
        } else {
          this.activePage.elements.push(c);
        }
      }
      this.selectedIds = copies.map((c) => c.id);
      this.commit();
    },
    duplicateSelected() {
      const els = this.selectedElements;
      if (!els.length) return;
      const copies = els.map((el) => cloneElement(el));
      for (const c of copies) {
        if (this.editingMaster) {
          if (!this.doc.master) this.doc.master = { header: [], footer: [] };
          this.doc.master.header.push(c);
        } else {
          this.activePage.elements.push(c);
        }
      }
      this.selectedIds = copies.map((c) => c.id);
      this.commit();
    },
    deleteSelected() {
      if (!this.selectedIds.length) return;
      const locked = this.selectedElements.some((e) => e.locked);
      if (locked && this.selectedElements.every((e) => e.locked)) return;
      const remove = new Set(
        this.selectedIds.filter((id) => {
          const el = this.workingElements.find((e) => e.id === id);
          return el && !el.locked;
        })
      );
      if (this.editingMaster && this.doc.master) {
        this.doc.master.header = this.doc.master.header.filter((e) => !remove.has(e.id));
        this.doc.master.footer = this.doc.master.footer.filter((e) => !remove.has(e.id));
      } else {
        this.activePage.elements = this.activePage.elements.filter((e) => !remove.has(e.id));
      }
      this.selectedIds = [];
      this.commit();
    },
    groupSelected() {
      if (this.selectedIds.length < 2) return;
      const gid = uid2();
      for (const el of this.selectedElements) {
        if (!el.locked) el.groupId = gid;
      }
      this.commit();
    },
    ungroupSelected() {
      for (const el of this.selectedElements) {
        el.groupId = void 0;
      }
      this.commit();
    },
    toggleLock() {
      if (!this.selected) return;
      const next = !this.selected.locked;
      for (const el of this.selectedElements) el.locked = next;
      this.commit();
    },
    bringForward() {
      const i = this.selectedIndex;
      const arr = this.workingElements;
      if (i < 0 || i >= arr.length - 1) return;
      [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
      this.commit();
    },
    sendBackward() {
      const i = this.selectedIndex;
      const arr = this.workingElements;
      if (i <= 0) return;
      [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
      this.commit();
    },
    bringToFront() {
      const i = this.selectedIndex;
      const arr = this.workingElements;
      if (i < 0 || i >= arr.length - 1) return;
      const [el] = arr.splice(i, 1);
      arr.push(el);
      this.commit();
    },
    sendToBack() {
      const i = this.selectedIndex;
      const arr = this.workingElements;
      if (i <= 0) return;
      const [el] = arr.splice(i, 1);
      arr.unshift(el);
      this.commit();
    },
    alignSelected(edge) {
      const els = this.selectedElements.filter((e) => !e.locked);
      if (!els.length) return;
      const { width, height } = this.pageSize;
      if (els.length === 1) {
        const el = els[0];
        if (edge === "left") el.x = 40;
        if (edge === "center") el.x = Math.round((width - el.width) / 2);
        if (edge === "right") el.x = Math.round(width - el.width - 40);
        if (edge === "top") el.y = 40;
        if (edge === "middle") el.y = Math.round((height - el.height) / 2);
        if (edge === "bottom") el.y = Math.round(height - el.height - 40);
      } else {
        const minX = Math.min(...els.map((e) => e.x));
        const maxX = Math.max(...els.map((e) => e.x + e.width));
        const minY = Math.min(...els.map((e) => e.y));
        const maxY = Math.max(...els.map((e) => e.y + e.height));
        for (const el of els) {
          if (edge === "left") el.x = minX;
          if (edge === "right") el.x = maxX - el.width;
          if (edge === "center") el.x = Math.round((minX + maxX - el.width) / 2);
          if (edge === "top") el.y = minY;
          if (edge === "bottom") el.y = maxY - el.height;
          if (edge === "middle") el.y = Math.round((minY + maxY - el.height) / 2);
        }
      }
      this.commit();
    },
    nudge(dx, dy, fine) {
      const step = fine ? 1 : this.snapEnabled ? 8 : 4;
      for (const el of this.selectedElements) {
        if (el.locked) continue;
        el.x += dx * step;
        el.y += dy * step;
      }
      this.commit();
    },
    addGuideFromRuler(axis, event) {
      const { x, y } = this.pageCoords(event);
      const guide = {
        id: uid2(),
        axis,
        position: axis === "x" ? this.snap(x) : this.snap(y)
      };
      if (!this.doc.guides) this.doc.guides = [];
      this.doc.guides.push(guide);
      this.drag = { mode: "guide", axis, id: guide.id };
      this.commit(false);
    },
    removeGuide(id) {
      this.doc.guides = (this.doc.guides || []).filter((g) => g.id !== id);
      this.commit();
    },
    toggleEditMaster() {
      this.editingMaster = !this.editingMaster;
      this.selectedIds = [];
      if (this.editingMaster && !this.doc.master) {
        this.doc.master = { header: [], footer: [] };
      }
    },
    addMasterPageNumber() {
      if (!this.doc.master) this.doc.master = { header: [], footer: [] };
      const el = createText(this.pageSize.width / 2 - 40, this.pageSize.height - 48, {
        content: "Page {{page}} / {{pages}}",
        fontSize: 10,
        color: "#64748b",
        width: 80,
        height: 20,
        align: "center"
      });
      this.doc.master.footer.push(el);
      this.commit();
    },
    setWatermarkText(text) {
      this.doc.watermark = {
        type: "text",
        text,
        opacity: 0.12,
        rotation: -30,
        fontSize: 56,
        color: "#94a3b8"
      };
      this.commit();
    },
    clearWatermark() {
      this.doc.watermark = null;
      this.commit();
    },
    runFind() {
      const q = this.findQuery.trim().toLowerCase();
      this.findMatches = [];
      if (!q) return;
      this.doc.pages.forEach((page, pageIndex) => {
        for (const el of page.elements) {
          if (el.type === "text" || el.type === "sticky") {
            if (el.content.toLowerCase().includes(q)) {
              this.findMatches.push({ pageIndex, elId: el.id, field: "content" });
            }
          } else if (el.type === "badge" || el.type === "stamp") {
            if (el.label.toLowerCase().includes(q)) {
              this.findMatches.push({ pageIndex, elId: el.id, field: "label" });
            }
          } else if (el.type === "table") {
            if (el.cells.some((c) => c.toLowerCase().includes(q))) {
              this.findMatches.push({ pageIndex, elId: el.id, field: "cells" });
            }
          } else if (el.type === "checkbox" || el.type === "formCheck") {
            if (el.label.toLowerCase().includes(q)) {
              this.findMatches.push({ pageIndex, elId: el.id, field: "label" });
            }
          }
        }
      });
      this.findIndex = this.findMatches.length ? 0 : -1;
      this.jumpToFindMatch();
    },
    jumpToFindMatch() {
      const m = this.findMatches[this.findIndex];
      if (!m) return;
      this.activePageIndex = m.pageIndex;
      this.selectedIds = [m.elId];
    },
    findNext() {
      if (!this.findMatches.length) return;
      this.findIndex = (this.findIndex + 1) % this.findMatches.length;
      this.jumpToFindMatch();
    },
    replaceCurrent() {
      const m = this.findMatches[this.findIndex];
      if (!m) return;
      const page = this.doc.pages[m.pageIndex];
      const el = page?.elements.find((e) => e.id === m.elId);
      if (!el) return;
      const q = this.findQuery;
      const r = this.replaceQuery;
      if (el.type === "text" || el.type === "sticky") {
        el.content = el.content.split(q).join(r);
      } else if (el.type === "badge" || el.type === "stamp" || el.type === "checkbox" || el.type === "formCheck") {
        el.label = el.label.split(q).join(r);
      } else if (el.type === "table") {
        el.cells = el.cells.map((c) => c.split(q).join(r));
      }
      this.commit();
      this.runFind();
    },
    replaceAll() {
      const q = this.findQuery;
      if (!q) return;
      const r = this.replaceQuery;
      for (const page of this.doc.pages) {
        for (const el of page.elements) {
          if (el.type === "text" || el.type === "sticky") el.content = el.content.split(q).join(r);
          else if (el.type === "badge" || el.type === "stamp" || el.type === "checkbox" || el.type === "formCheck") {
            el.label = el.label.split(q).join(r);
          } else if (el.type === "table") el.cells = el.cells.map((c) => c.split(q).join(r));
        }
      }
      this.commit();
      this.runFind();
    },
    addCommentAt(x, y) {
      const body = this.commentDraft.trim() || prompt("Comment") || "";
      if (!body.trim()) return;
      if (!this.doc.comments) this.doc.comments = [];
      this.doc.comments.push({
        id: uid2(),
        pageId: this.activePage.id,
        x,
        y,
        body: body.trim(),
        author: this.authorName || "Reviewer",
        resolved: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      this.commentDraft = "";
      this.tool = "select";
      this.commit();
    },
    toggleCommentResolved(id) {
      const c = (this.doc.comments || []).find((c2) => c2.id === id);
      if (!c) return;
      c.resolved = !c.resolved;
      this.commit();
    },
    deleteComment(id) {
      this.doc.comments = (this.doc.comments || []).filter((c) => c.id !== id);
      this.commit();
    },
    saveBrand() {
      storeSet(BRAND_KEY, JSON.stringify(this.brand));
    },
    saveAuthorName() {
      storeSet(AUTHOR_KEY, this.authorName || "Reviewer");
    },
    applyBrandToSelection() {
      for (const el of this.selectedElements) {
        if (el.type === "text") {
          el.fontFamily = this.brand.defaultFont || el.fontFamily;
          if (this.brand.colors[2]) el.color = this.brand.colors[2];
        }
        if (el.type === "rect" && this.brand.colors[0]) el.fill = this.brand.colors[0];
      }
      this.commit();
      this.saveBrand();
    },
    async onBrandLogoSelected(event) {
      const input = event.target;
      const file = input.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append("image", file);
      try {
        const res = await apiFetch("/api/upload", { method: "POST", body: form });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Upload failed");
        this.brand.logoUrl = payload.url;
        this.brand.logoName = payload.name;
        this.saveBrand();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Logo upload failed");
      } finally {
        input.value = "";
      }
    },
    insertBrandLogo() {
      if (!this.brand.logoUrl) return;
      const el = createImage(40, 40, {
        src: this.brand.logoUrl,
        name: this.brand.logoName || "Logo",
        width: 120,
        height: 60
      });
      this.pushElement(el);
    },
    async onPdfImportSelected(event) {
      const input = event.target;
      const file = input.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append("pdf", file);
      try {
        const res = await apiFetch("/api/import", { method: "POST", body: form });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Import failed");
        this.doc = normalizeDoc(payload.document);
        this.activePageIndex = 0;
        this.selectedIds = [];
        history.reset(this.doc);
        this.syncHistoryFlags();
        this.commit(false);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not import PDF");
      } finally {
        input.value = "";
      }
    },
    openExportModal() {
      this.showExportModal = true;
    },
    saveExportSettings() {
      storeSet(EXPORT_KEY, JSON.stringify(this.exportSettings));
    },
    onKeydown(event) {
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable) {
        return;
      }
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        this.undo();
        return;
      }
      if (mod && event.key.toLowerCase() === "y" || mod && event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        this.redo();
        return;
      }
      if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        this.duplicateSelected();
        return;
      }
      if (mod && event.key.toLowerCase() === "c") {
        event.preventDefault();
        this.copySelected();
        return;
      }
      if (mod && event.key.toLowerCase() === "x") {
        event.preventDefault();
        this.cutSelected();
        return;
      }
      if (mod && event.key.toLowerCase() === "v") {
        event.preventDefault();
        this.pasteClipboard();
        return;
      }
      if (mod && event.key.toLowerCase() === "g" && !event.shiftKey) {
        event.preventDefault();
        this.groupSelected();
        return;
      }
      if (mod && event.shiftKey && event.key.toLowerCase() === "g") {
        event.preventDefault();
        this.ungroupSelected();
        return;
      }
      if (mod && event.key.toLowerCase() === "f") {
        event.preventDefault();
        this.showFindReplace = true;
        return;
      }
      if (mod && event.key.toLowerCase() === "s") {
        event.preventDefault();
        this.commit(false);
        storeSet(STORAGE_KEY, JSON.stringify(this.doc));
        return;
      }
      if (mod && event.key.toLowerCase() === "e") {
        event.preventDefault();
        this.openExportModal();
        return;
      }
      if (event.key === "Escape") {
        this.selectedIds = [];
        this.editingTextId = null;
        this.tool = "select";
        this.pendingLibraryKind = null;
        this.placeHint = false;
        this.libraryKeepPlacing = false;
        this.showExportModal = false;
        this.showSignatureModal = false;
        this.showFindReplace = false;
        this.showFileMenu = false;
        this.showTemplates = false;
        return;
      }
      if (event.key === "/" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        this.leftRail = "insert";
        this.showLibrary = true;
        queueMicrotask(() => {
          const input = this.$refs.librarySearch;
          input?.focus();
        });
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        this.deleteSelected();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.nudge(-1, 0, event.shiftKey);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        this.nudge(1, 0, event.shiftKey);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        this.nudge(0, -1, event.shiftKey);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        this.nudge(0, 1, event.shiftKey);
        return;
      }
      const map = {
        v: "select",
        t: "text",
        r: "rect",
        o: "ellipse",
        l: "line"
      };
      const tool = map[event.key.toLowerCase()];
      if (tool) this.tool = tool;
    },
    async onImageSelected(event) {
      const input = event.target;
      const file = input.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append("image", file);
      try {
        const res = await apiFetch("/api/upload", { method: "POST", body: form });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.error || "Upload failed");
        const imageEl = createImage(80, 80, {
          src: payload.url,
          name: payload.name,
          width: payload.width,
          height: payload.height
        });
        this.pushElement(imageEl);
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : "Could not upload image.");
      } finally {
        input.value = "";
      }
    },
    openSignatureModal(x = null, y = null, replaceId = null) {
      this.signaturePlace = x != null && y != null ? { x, y } : null;
      this.signatureReplaceId = replaceId;
      this.signatureTab = "draw";
      this.signatureTyped = "";
      this.signatureHasInk = false;
      this.signatureBusy = false;
      this.showSignatureModal = true;
      this.tool = "select";
      this.pendingLibraryKind = null;
      this.placeHint = false;
      setTimeout(() => this.resetSignaturePad(), 40);
    },
    closeSignatureModal() {
      this.showSignatureModal = false;
      this.signaturePlace = null;
      this.signatureReplaceId = null;
      this.signatureHasInk = false;
    },
    signaturePad() {
      return this.$refs.signaturePad ?? null;
    },
    resetSignaturePad() {
      const canvas = this.signaturePad();
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.clientWidth || 520;
      const cssH = canvas.clientHeight || 180;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      this.signatureHasInk = false;
    },
    clearSignaturePad() {
      this.resetSignaturePad();
      this.signatureTyped = "";
    },
    signaturePointerPos(event) {
      const canvas = this.signaturePad();
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    },
    onSignaturePointerDown(event) {
      if (this.signatureTab !== "draw") return;
      const canvas = this.signaturePad();
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      canvas.setPointerCapture(event.pointerId);
      const { x, y } = this.signaturePointerPos(event);
      ctx.strokeStyle = this.signatureInk;
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
      this.signatureHasInk = true;
      this._sigDrawing = true;
    },
    onSignaturePointerMove(event) {
      if (!this._sigDrawing) return;
      const canvas = this.signaturePad();
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;
      const { x, y } = this.signaturePointerPos(event);
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    onSignaturePointerUp(event) {
      const canvas = this.signaturePad();
      canvas?.releasePointerCapture(event.pointerId);
      this._sigDrawing = false;
    },
    renderTypedSignature() {
      const text = this.signatureTyped.trim();
      if (!text) {
        this.resetSignaturePad();
        return;
      }
      const canvas = this.signaturePad();
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const cssW = canvas.clientWidth || 520;
      const cssH = canvas.clientHeight || 180;
      this.resetSignaturePad();
      const again = this.signaturePad()?.getContext("2d");
      if (!again) return;
      again.fillStyle = this.signatureInk;
      again.textAlign = "center";
      again.textBaseline = "middle";
      let size2 = 64;
      again.font = `${size2}px "Caveat", "Segoe Script", "Comic Sans MS", cursive`;
      while (size2 > 28 && again.measureText(text).width > cssW - 40) {
        size2 -= 2;
        again.font = `${size2}px "Caveat", "Segoe Script", "Comic Sans MS", cursive`;
      }
      again.fillText(text, cssW / 2, cssH / 2);
      this.signatureHasInk = true;
    },
    async uploadSignatureBlob(blob, name) {
      const form = new FormData();
      form.append("image", blob, name);
      const res = await apiFetch("/api/upload", { method: "POST", body: form });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Signature upload failed");
      return payload;
    },
    async placeSignatureFromPayload(payload) {
      const maxW = 280;
      const scale = Math.min(1, maxW / Math.max(payload.width, 1));
      const width = Math.max(120, Math.round(payload.width * scale));
      const height = Math.max(48, Math.round(payload.height * scale));
      const page = this.pageSize;
      const x = this.snap(this.signaturePlace?.x ?? page.width / 2 - width / 2);
      const y = this.snap(this.signaturePlace?.y ?? page.height - height - 72);
      if (this.signatureReplaceId) {
        const existing = this.workingElements.find((e) => e.id === this.signatureReplaceId);
        if (existing && existing.type === "signature") {
          existing.src = payload.url;
          existing.name = payload.name || "Signature";
          existing.width = width;
          existing.height = height;
          this.commit();
          this.closeSignatureModal();
          return;
        }
      }
      const el = createSignature(x, y, {
        src: payload.url,
        name: payload.name || "Signature",
        width,
        height
      });
      this.pushElement(el);
      this.closeSignatureModal();
    },
    async confirmSignature() {
      if (this.signatureBusy) return;
      try {
        this.signatureBusy = true;
        if (this.signatureTab === "type") {
          this.renderTypedSignature();
        }
        if (this.signatureTab === "upload") {
          this.$refs.signatureFileInput.click();
          return;
        }
        const canvas = this.signaturePad();
        if (!canvas || !this.signatureHasInk) {
          alert("Draw or type a signature first.");
          return;
        }
        const trimmed = trimSignatureCanvas(canvas);
        const blob = await new Promise((resolve) => trimmed.toBlob(resolve, "image/png"));
        if (!blob) throw new Error("Could not capture signature");
        const payload = await this.uploadSignatureBlob(blob, "signature.png");
        await this.placeSignatureFromPayload({
          ...payload,
          name: this.signatureTyped.trim() || "Signature"
        });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not add signature");
      } finally {
        this.signatureBusy = false;
      }
    },
    async onSignatureFileSelected(event) {
      const input = event.target;
      const file = input.files?.[0];
      if (!file) return;
      try {
        this.signatureBusy = true;
        const payload = await this.uploadSignatureBlob(file, file.name);
        await this.placeSignatureFromPayload(payload);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not upload signature");
      } finally {
        this.signatureBusy = false;
        input.value = "";
      }
    },
    async exportPdf() {
      this.saveExportSettings();
      this.exporting = true;
      this.showExportModal = false;
      try {
        const res = await apiFetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: this.doc.name,
            pageSize: this.doc.pageSize,
            pageBackground: this.doc.pageBackground,
            pages: this.doc.pages,
            master: this.doc.master,
            watermark: this.doc.watermark,
            importedPdf: this.doc.importedPdf,
            exportSettings: this.exportSettings
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Export failed");
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${this.doc.name.replace(/[^\w.-]+/g, "_") || "document"}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : "Could not export PDF.");
      } finally {
        this.exporting = false;
      }
    }
  };
}
module_default.data("pdfEditor", pdfEditor);
module_default.data("themeToggle", () => ({
  theme: document.documentElement.getAttribute("data-theme") || "dark",
  init() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") {
      this.theme = saved;
      document.documentElement.setAttribute("data-theme", saved);
    }
  },
  toggleTheme() {
    this.theme = this.theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", this.theme);
    localStorage.setItem(THEME_KEY, this.theme);
  }
}));
module_default.start();
