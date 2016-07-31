import {combineReducers} from "redux";
import entities from "./reducers/entities";
import postsBySection from "./reducers/postsBySection";
import viewState from "./reducers/viewState";
import account from "./reducers/account";
export {migrateViewState} from "./reducers/viewState";

const JodelApp = combineReducers({
    entities,
    postsBySection,
    viewState,
    account,
});

export default JodelApp;
