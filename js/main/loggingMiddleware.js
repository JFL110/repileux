/**
 * Middleware that logs everything - for testing
 */
export default ({ getState }) => next => action => {
  console.log("action [", action, "] state : ", getState());
  next(action);
};
