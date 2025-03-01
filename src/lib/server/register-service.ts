/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

/**
 * Register service.
 * @description Stores instances in `global` to prevent memory leaks in development.
 * @arg {string} name Service name.
 * @arg {function} initFn Function returning the service instance.
 * @return {*} Service instance.
 */
const registerService = (name: string, initFn: Function) => {
  if (process.env.NODE_ENV === "development") {
    if (!(name in global)) {
      // @ts-ignore
      global[name] = initFn();
    }
    // @ts-ignore
    return global[name];
  }
  return initFn();
};

export default registerService;
