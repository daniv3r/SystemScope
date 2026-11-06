export type ComponentId = "clients" | "api" | "cache" | "db";
export const componentGuide: Record<ComponentId, { name: string; short: string; role: string; change: string; effect: string }> = {
  clients: {
    name: "Clients", short: "Ask for data",
    role: "Clients are apps or browsers asking for data. For example, opening a feed sends a request for a list of posts. One person can send many requests.",
    change: "Change offered traffic: the number of requests arriving each second (RPS).",
    effect: "More requests add demand. If the application or database cannot keep up, requests wait, time out, or are rejected when there is no room. More traffic does not guarantee more completed requests.",
  },
  api: {
    name: "API replicas", short: "Handle the request",
    role: "The API is the application that handles a request and prepares the response. A replica is another copy of that application. Each copy can fetch the posts a client asks for.",
    change: "Change API replicas to share incoming work across more copies of the application.",
    effect: "More copies add processing capacity and room for requests. They can help until the shared database becomes the slowest part. More API copies do not add database capacity.",
  },
  cache: {
    name: "Cache", short: "Reuse saved results",
    role: "A cache keeps saved read results, such as a list of posts. The API checks it first when enabled. A hit means the answer is saved; a miss means the API still needs the database.",
    change: "Enable cache to let 80% of cacheable reads reuse saved results in this model. When off, reads go straight to the database.",
    effect: "Hits skip database work, reducing demand on the database. Lookups still use application processing time, so cache helps most when the database is limiting completed requests.",
  },
  db: {
    name: "Database", short: "Read stored data",
    role: "The database is the shared place that serves stored data, such as posts. All API copies use the same database, which can serve four reads at a time in this model.",
    change: "Change database service speed: how long each read takes. A millisecond (ms) is one thousandth of a second.",
    effect: "Faster reads free the same four slots sooner, so more reads can finish. This can reduce waiting when the database is the limit, but does not add application processing capacity.",
  },
};
