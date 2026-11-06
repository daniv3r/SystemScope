import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// Observe actual protocol acceptance → completion/cancellation in the real module worker.
async function instrument(page: Page) {
  await page.addInitScript(() => {
    const Base = window.Worker;
    const events: {type:string;phase?:string;commandId?:number;time:number;history:boolean;status?:string;virtual?:number;execution?:string}[] = [];
    Object.assign(window,{__workerEvents:events});
    window.Worker = class extends Base {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url,options);
        this.addEventListener("message",e => {
          const r=e.data;
          events.push({type:r.type,phase:r.phase,commandId:r.commandId,time:performance.now(),history:!!r.view?.history,status:r.view?.status,virtual:r.view?.observation.time,execution:r.view?.executionStyle});
          if(events.length>1000) events.shift();
        });
      }
      postMessage(message: unknown, transfer?: Transferable[] | StructuredSerializeOptions) {
        const m = message as {type:string;commandId:number};
        events.push({type:`SEND_${m.type}`,commandId:m.commandId,time:performance.now(),history:false});
        if (Array.isArray(transfer)) super.postMessage(message,transfer);
        else super.postMessage(message,transfer);
      }
    };
  });
}
async function events(page: Page) {
  return page.evaluate(() => (window as unknown as {__workerEvents:{type:string;phase?:string;commandId?:number;time:number;history:boolean;status?:string;virtual?:number;execution?:string}[]}).__workerEvents);
}
test("fast result budget, optional history, maximum-load cancellation and Watch refresh",async ({page}) => {
  await instrument(page);
  await page.goto("./");
  await expect(page.getByTestId("run-status")).toHaveText("finished");
  let log=await events(page);
  const baselineMs=log.find(e=>e.type==="FINISHED")!.time-log.find(e=>e.phase==="accepted")!.time;
  expect(baselineMs).toBeLessThan(5000);
  expect(log.every(e=>!e.history)).toBe(true);
  await page.getByLabel("Offered traffic, requests per second").selectOption("1000");
  await page.getByRole("button",{name:"Run experiment",exact:true}).click();
  await expect(page.getByTestId("run-status")).toHaveText("finished");
  log=await events(page);
  const spikeMs=log.slice().reverse().find(e=>e.type==="FINISHED")!.time-log.slice().reverse().find(e=>e.phase==="accepted")!.time;
  expect(spikeMs).toBeLessThan(5000);
  await page.getByRole("button",{name:"Show charts",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Traffic in, work out"})).toBeVisible();
  expect((await events(page)).some(e=>e.history)).toBe(true);
  await page.getByRole("button",{name:"Hide charts",exact:true}).click();
  await page.getByLabel("Offered traffic, requests per second").selectOption("10000");
  await page.getByLabel("API replicas",{exact:true}).selectOption("8");
  await page.getByRole("button",{name:"Run experiment",exact:true}).click();
  await expect(page.getByRole("button",{name:"Cancel calculation"})).toBeVisible();
  await page.getByRole("button",{name:"Cancel calculation"}).click();
  await expect(page.getByTestId("run-status")).toHaveText("cancelled");
  log=await events(page);
  const cancel=log.slice().reverse().find(e=>e.type==="SEND_CANCEL")!;
  const ack=log.find(e=>e.type==="ACK"&&e.commandId===cancel.commandId)!;
  expect(ack.time-cancel.time).toBeLessThanOrEqual(250);
  const hide=log.map(e=>e.type==="SEND_SET_CHARTS").lastIndexOf(true)+1;
  expect(log.slice(hide).every(e=>!e.history)).toBe(true);
  await page.getByRole("button",{name:"Run experiment",exact:true}).click();
  await expect(page.getByTestId("run-status")).toHaveText("finished",{timeout:30000});
  log=await events(page);
  const maxMs=log.slice().reverse().find(e=>e.type==="FINISHED")!.time-log.slice().reverse().find(e=>e.phase==="accepted")!.time;
  await expect(page.getByTestId("virtual-time")).toHaveText("60.00 s");
  await page.getByRole("button",{name:"Watch simulation"}).click();
  await page.getByLabel("Playback speed").selectOption("4");
  await expect.poll(async()=>parseFloat(await page.getByTestId("virtual-time").innerText())).toBeGreaterThan(5);
  await page.getByRole("button",{name:"Pause",exact:true}).click();
  await expect(page.getByTestId("run-status")).toHaveText("paused");
  log=await events(page);
  const pause=log.slice().reverse().find(e=>e.type==="SEND_PAUSE")!;
  expect(log.find(e=>e.type==="ACK"&&e.commandId===pause.commandId)!.time-pause.time).toBeLessThanOrEqual(250);
  const updates=log.filter(e=>e.type==="PROGRESS"&&e.execution==="playback");
  expect(updates.length).toBeGreaterThan(2);
  expect((updates.length-1)*1000/(updates.at(-1)!.time-updates[0].time)).toBeGreaterThanOrEqual(2);
  console.log(JSON.stringify({baselineMs,spikeMs,fastMaximumMs:maxMs,fastCancelMs:ack.time-cancel.time,playbackUpdates:updates.length}));
});
