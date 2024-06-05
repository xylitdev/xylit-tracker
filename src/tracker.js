const contexts  = [];
const scheduled = new Set();
const tracking  = new WeakMap();

let timeoutId = null;
const schedule = fn => {
  clearTimeout(timeoutId);
  scheduled.add(fn);

  timeoutId = setTimeout(() => {
    scheduled.forEach(run => run());
    scheduled.clear();
  }, 0);
}


const notifyAccess = (target, prop) => {
  contexts[0]?.push?.({ target, prop });
} 


const notifyMutation = (target, prop) => {
  const fns = tracking.get(target)?.[prop];
  fns?.forEach?.(fn => schedule(fn));
}


export const track = obj => new Proxy(obj, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);

    notifyAccess(target, prop);

    if (typeof value === 'object') {
      return track(value);
    }

    return value;
  },

  set(target, prop, value, receiver) {
    notifyMutation(target, prop);

    return Reflect.set(target, prop, value, receiver);
  }
});


export const run = fn => {
  const runFn = () => {
    const accessed = [];
    contexts.unshift(accessed);
    fn();
    contexts.shift(accessed);

    for (const { target, prop } of accessed) {
      const fns = tracking.get(target) || {};
      fns[prop] = fns[prop] || new Set();
      fns[prop].add(runFn);
      tracking.set(target, fns);
    }
  }

  runFn();
};