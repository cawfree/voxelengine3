import { createStore, applyMiddleware, combineReducers } from "redux";
import thunkMiddleware from "redux-thunk";

import { reducer as model } from "./model";

export default () => createStore(
  combineReducers(
    {
      model,
    },
  ),
  applyMiddleware(
    thunkMiddleware,
  ),
);
