import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter(): ReturnType<typeof createRouter> {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
  });

  return router;
}

export default getRouter;

declare module "@tanstack/react-router" {
  type Register = {
    router: ReturnType<typeof getRouter>;
  };
}
