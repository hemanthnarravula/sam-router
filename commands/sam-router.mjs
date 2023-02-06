import fg from "fast-glob";
import { promises as fsp } from "fs";
import YAML from "yaml";
import { createServer } from "http";
import {
  createApp,
  eventHandler,
  toNodeListener,
  createRouter,
  getRouterParams,
  getQuery,
  getHeaders,
  readRawBody,
  send,
} from "h3";

async function sam_router() {
  const entries = await fg(["template.yaml"], { dot: true });
  const app = createApp();
  let router = createRouter();
  function sanitizePath(path) {
    return path.replace(/[{]/g, ":").replace(/[}]/g, "");
  }
  if (entries.length > 0) {
    const data = await fsp.readFile(entries[0], { encoding: "utf-8" });
    const fileData = YAML.parse(data, {
      schema: "failsafe",
      strict: false,
      logLevel: "silent",
    });
    const resourcesObj = fileData.Resources;
    Object.keys(resourcesObj).forEach((el) => {
      let resource = resourcesObj[el];
      if (resource.Type === "AWS::Serverless::Function") {
        const events = resource.Properties.Events;
        if (typeof events === "object") {
          Object.keys(events).forEach((el) => {
            const event = events[el];
            if (event.Type === "Api") {
              const properties = event.Properties;
              const apiPath = sanitizePath(properties.Path);
              console.log("Method->", properties.Method, "path--->", apiPath);
              // router[properties.Method](
              //   apiPath,
              //   eventHandler(() => "Hello world!")
              // );

              router[properties.Method](
                apiPath,
                eventHandler(async (event) => {
                  const eventObj = {
                    pathParameters: getRouterParams(event),
                    queryStringParameters: getQuery(event),
                    headers: getHeaders(event),
                    requestContext: {
                      identity: { sourceIp: "127.0.0.1" },
                    },
                    resource: apiPath,
                    path: apiPath,
                    httpMethod: properties.Method.toUpperCase(),
                  };
                  if (properties.Method === "post") {
                    eventObj.body = await readRawBody(event);
                  } else if (properties.Method === "put") {
                    console.log(properties.Method, "--<");
                    eventObj.body = await readRawBody(event);
                  }
                  const filePath = `${process.cwd()}/${
                    resource.Properties.CodeUri
                  }/${resource.Properties.Handler.split(".")[0]}.js`;
                  const functionName = `${
                    resource.Properties.Handler.split(".")[1]
                  }`;
                  console.log(filePath, functionName);
                  return import(filePath).then(async (file) => {
                    let response = await file[functionName](eventObj);
                    // console.log(response.headers);
                    return await send(
                      event,
                      response.body,
                      response?.headers["Content-Type"]
                    );
                  });
                })
              );
            }
          });
        }
      }
    });
    app.use(router);
    createServer(toNodeListener(app)).listen(process.env.PORT || 3000);
  }
}

export default sam_router;
