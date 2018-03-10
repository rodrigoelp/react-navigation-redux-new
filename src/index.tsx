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
  createReactNavigationReduxMiddleware } from "react-navigation-redux-helpers";

interface Page1Props {}
interface Page1Actions {
  goNext: () => any;
}

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

function mapStateToPage1Props(state: any) {
  return {};
}

function mapDispatchToPage1Actions(dispatch: Dispatch<any>) {
  return bindActionCreators({ goNext: goNextActionCreator }, dispatch);
}

const Page1Container = connect(mapStateToPage1Props, mapDispatchToPage1Actions)(
  Page1
);

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

function mapStateToPage2Props(state: any) {
  return {};
}

function mapDispatchToPage2Actions(dispatch: Dispatch<any>) {
  return bindActionCreators({ goBack: goBackActionCreator }, dispatch);
}

const Page2Container = connect(mapStateToPage2Props, mapDispatchToPage2Actions)(
  Page2
);

const routeConfig: NavigationRouteConfigMap = {
  ["page1"]: Page1Container,
  ["page2"]: Page2Container
};

const stackConfig: StackNavigatorConfig = {
  initialRouteName: "page1",
  initialRouteParams: {}
};

const RootNavigator = StackNavigator(routeConfig, stackConfig);

interface RootNavProps {
  navState: any;
  dispatch: any;
}

const rootNavMiddleware = createReactNavigationReduxMiddleware<AppState>(
  "root",
  state => state.rootNavigatorState,
);

const addListener = createReduxBoundAddListener("root");

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

function mapStateToRootNavProps(state: any) {
  return {
    navState: state.rootNavigatorState
  };
}

const RootNavigatorContainer = connect(mapStateToRootNavProps)(
  RootNavigatorHost
);

const initialState = RootNavigator.router.getStateForAction(
  NavigationActions.reset({
    index: 0,
    actions: [NavigationActions.navigate({ routeName: "page1" })]
  }),
  undefined
);

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
    // default:
    //   nextState = RootNavigator.router.getStateForAction(action, state);
    //   return;
  }
  console.debug("New state is", nextState || state);
  return nextState || state;
}

interface AppState {
  rootNavigatorState: any;
}

const reducers = combineReducers({
  rootNavigatorState: rootNavigatorReducer
});

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

const middleware = applyMiddleware(Thunk, rootNavMiddleware);

const appStore = createStore(reducers, middleware);

const App = () => (
  <Provider store={appStore}>
    <RootNavigatorContainer />
  </Provider>
);

AppRegistry.registerComponent("reduxstacknav", () => App);
