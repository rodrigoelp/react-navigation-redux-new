/**
 * @author Rod Landaeta
 * @description the contents of this file describe what you need to do to get
 * react-navigation to work in a react native project, controlled via redux.
 */

import * as React from "react";
import { AppRegistry, View, Button } from "react-native";
import {
  StackNavigator,
  NavigationRouteConfigMap,
  StackNavigatorConfig,
  addNavigationHelpers,
  NavigationActions,
  NavigationEventCallback,
  NavigationEventSubscription
} from "react-navigation";
import {
  createStore,
  applyMiddleware,
  combineReducers,
  AnyAction,
  bindActionCreators
} from "redux";
import { connect, Provider, Dispatch } from "react-redux";
import Thunk from "redux-thunk";
import {
  createReduxBoundAddListener,
  createReactNavigationReduxMiddleware
} from "react-navigation-redux-helpers";

/**
 * Step 1: Create the pages/screens/views you want to
 * navigate to a from.
 *
 * In this sample, I will create two views (or pages)
 * with simple actions to call in.
 *
 * Hope you are not new to redux, but... below you
 * will find two interfaces, these are used by redux
 * to inject/replace the state to be use by your component.
 */

interface Page1Props {}
interface Page1Actions {
  goNext: () => any;
}
// Our component requires a single type to express
// all the properties to be created by redux (properties and actions)
// This only merges these types
type Page1JoinedProp = Page1Props & Page1Actions;

class Page1 extends React.Component<Page1JoinedProp> {
  constructor(props: Page1JoinedProp) {
    super(props);
  }

  public render() {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#aaaaff",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <Button onPress={this.goNext} title="Go Next!" />
      </View>
    );
  }

  goNext = () => {
    this.props.goNext();
  };
}

// 2. Now we need to map state and actions to
// something our component will be able to use.

// Create one mapping function for the state.
function mapStateToPage1Props(state: any): Page1Props {
  return {};
}

// and one mapping function for actions that will replace
// the state in the store. Notice this calls an ActionCreator, which
// is a function to define when we create the reducers.
function mapDispatchToPage1Actions(dispatch: Dispatch<any>) {
  return bindActionCreators({ goNext: goNextActionCreator }, dispatch);
}

// 3. Turn that component into a container by connecting (via redux) the mapping functions
// with the type.
const Page1Container = connect(mapStateToPage1Props, mapDispatchToPage1Actions)(
  Page1
);

// Same as Step 1.
interface Page2Props {}
interface Page2Actions {
  goBack: () => any;
}
type Page2JoinedProps = Page2Props & Page2Actions;

class Page2 extends React.Component<Page2JoinedProps> {
  constructor(props: Page2JoinedProps) {
    super(props);
  }
  public render() {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "red",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <Button title="Time to go back" onPress={this.goBack} />
      </View>
    );
  }
  goBack = () => {
    this.props.goBack();
  };
}

// same as step 2.
function mapStateToPage2Props(state: any): Page2Props {
  return {};
}
function mapDispatchToPage2Actions(dispatch: Dispatch<any>) {
  return bindActionCreators({ goBack: goBackActionCreator }, dispatch);
}

// same as step 3.
const Page2Container = connect(mapStateToPage2Props, mapDispatchToPage2Actions)(
  Page2
);

/**
 * Once you have finished repeating steps 1, 2 and 3 for each of your view/screens
 * is time to start configuring the navigation to implement in the app.
 * 
 * In this case, we are going to use a StackNavigator.
 */

// Step 4: Configure a stack navigator by providing
// route names to each of your containers/components.
const routeConfig: NavigationRouteConfigMap = {
  ["page1"]: Page1Container,
  ["page2"]: Page2Container
};
// Step 5: And you will need to provide an initial route name to
// initialise properly the stack navigator (although redux does not know 
// about this.)
const stackConfig: StackNavigatorConfig = {
  initialRouteName: "page1",
  initialRouteParams: {}
};
// Step 6: Create the navigator.
const RootNavigator = StackNavigator(routeConfig, stackConfig);

// Step 7: turn that navigator into a container.
// To do that you need to repeat a similar process to steps 1 to 3
// with a component that is going to render the RootNavigator from the line above.
// Now... there is a little of a side track that needs to be done to get to that point.

// So, Step 7.1. We create properties for that component.
// You need to provide two properties:
// First is the state required for that route/navigation path.
// Second is the dispatch function.
interface RootNavProps {
  navState: any;
  dispatch: any;
}

// Step 7.2: Due to some changes in react-navigation we need to create *now*
// a middleware to listen for changes to communicate it to the redux store.
// But hey, notice that to create the middleware I need to provide the shape
// of my store, that's ok, we will create it in a sec.
const rootNavMiddleware = createReactNavigationReduxMiddleware<AppStore>(
  "root",
  state => state.rootNavigatorState
);

// Step 7.3: getting the shape of the store out of the way. For the time
// being, let's add the state to be used by the navigator. Keep in mind that
// later on, when we setup all our reducers the shape of all the reducers
// combined has to match the shape of the store (notice I say shape and not type.)
interface AppStore {
  rootNavigatorState: any;
}

// Step 7.4: with the middleware, let's create that listener with the same key
const addListener = createReduxBoundAddListener("root");

// Step 7.5: Now we create the component hosting the stack navigator
// configured with a custom navigation object that knows how to communicate
// with redux.
class RootNavigatorHost extends React.PureComponent<RootNavProps> {
  constructor(props: RootNavProps) {
    super(props);
  }

  public render() {
    const navigation = addNavigationHelpers({
      dispatch: this.props.dispatch,
      state: this.props.navState,
      addListener: addListener
    });
    return <RootNavigator navigation={navigation} />;
  }
}

// Step 7.6: create mappers for state (for this sample, that is all that is required.)
function mapStateToRootNavProps(state: any) {
  return {
    navState: state.rootNavigatorState
  };
}

// Step 7.7: turn that component into a container.
const RootNavigatorContainer = connect(mapStateToRootNavProps)(
  RootNavigatorHost
);

/**
 * Now we have a set of containers ready to work... but 
 * there is no configuration for redux. let's do that.
 */

// Step 8: create the state reducer for the navigator.
// The reducer called any/everytime an action is performed on the state/store.
// Now, the store needs to know its initial state from which is going to evolve and
// redux provides two ways of providing that initial state. Via the reducer itself
// or via the preloaded state injected in the createStore method.
// I will use the first approach, providing the initial state to the reducer.
// The initial state for a navigator is its first screen. Let's navigate to that first screen
const initialState = RootNavigator.router.getStateForAction(
  NavigationActions.navigate({ routeName: "page1" }),
  undefined
);

// Step 9: create the reducer. This one changes the state of the navigator
// given an action to replace that state. I created two action types: 
// one to navigate away of the first screen.
// one to navigate back to the first screen.
function rootNavigatorReducer(
  state: any = initialState,
  action: AnyAction
): any {
  console.debug("This is the state.", state);
  console.debug("The action is", action.type);
  let nextState: any;
  switch (action.type) {
    case "GO_NEXT":
      nextState = RootNavigator.router.getStateForAction(
        NavigationActions.navigate({ routeName: "page2" }),
        state
      );
      break;
    case "GO_BACK":
      nextState = RootNavigator.router.getStateForAction(
        NavigationActions.back(),
        state
      );
      break;
  }
  console.debug("New state is", nextState || state);
  return nextState || state;
}

// Step 10: join all the reducers. Remember step 7.3?
// When you combined all the reducer you define the shape (names)
// that will be used to create the store, and the return type of each reducer
// is going to be the type of the property matched in the store.
// TODO: find a way to provide a type to the combineReducers so this is type safe.
// TODO: if you know how to do this, create a pull request ;)
const reducers = combineReducers({
  rootNavigatorState: rootNavigatorReducer
});

// Step 11: Now we create the action creators. This issue (dispatch) the command/action
// triggering state reducers to reevaluate their state. In here I say "hey, let's go to x or y screen!"
// I prefer types (functions) configured here I want to go as opposed to having a magic string (or constant)
// wired up every time I want to call this from a component. You might want to change this to take it as an 
// argument having a single action creator. Is up to you.
function goNextActionCreator() {
  return (dispatch: Dispatch<any>) => {
    dispatch({ type: "GO_NEXT" });
  };
}

function goBackActionCreator() {
  return (dispatch: Dispatch<any>) => {
    dispatch({ type: "GO_BACK" });
  };
}

// Step 12: time to put the store together. To do that we "merge" all the middleware
// we are going to apply to the store.
const middleware = applyMiddleware(Thunk, rootNavMiddleware);

// Step 13: and create the store with the reducers and the middleware.
const appStore = createStore(reducers, middleware);

// Step 14: Let's create the component that presents everything to the user
// and wires all the moving parts (store, reducers, action creators and containers) together.
const App = () => (
  <Provider store={appStore}>
    <RootNavigatorContainer />
  </Provider>
);

AppRegistry.registerComponent("reduxstacknav", () => App);
