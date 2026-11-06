import { Controller } from "./controller";
const controller = new Controller((r) => self.postMessage(r));
self.onmessage = (e) => {
  controller.handle(e.data);
};
let lastPublish = 0,
  due = 0;
const channel = new MessageChannel();
channel.port1.onmessage = turn;
function turn() {
  const now = performance.now();
  let delay = 25;
  if (controller.initializing || (controller.status === "running" && controller.executionStyle === "fast")) {
    const publish = now - lastPublish >= 100;
    for (let i = 0; i < 10; i++) controller.tick(publish && i === 9);
    if (publish) lastPublish = now;
    delay = 0;
    due = now;
  } else if (controller.status === "running") {
    if (now >= due) {
      const publish = now - lastPublish >= 100;
      controller.tick(publish);
      if (publish) lastPublish = now;
      controller.lagging = now - due > 100;
      due = Math.max(due + 10 / controller.speed, now - 100);
    }
    delay = Math.max(0, due - performance.now());
  } else due = now;
  if (delay > 0) setTimeout(() => channel.port2.postMessage(0), delay);
  else channel.port2.postMessage(0);
}
turn();
