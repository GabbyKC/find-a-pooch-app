import { Client } from "@petfinder/petfinder-js";
import { DOGS_LOADED, DOG_CLEAR, DOGGO_LOADED, ORGS_LOADED, GIF_LOADED, GIF_CLEAR, FILTER_UPDATE, MESSAGES_LOADED, USER_LOGGED_IN, USER_LOGGED_OUT } from '../constants/action-types';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

const client = new Client({apiKey: "WjqoS08v7pRPJ2offXSrIW0RaORTy296kNOjNu7l8O94y0IYTy", secret: "CTMMNXK3b8TcjiNT4GNhzeCqetoF2HZNk5c0mjF0"});
const provider = new firebase.auth.GoogleAuthProvider();

export function setupAuth() {
    return function(dispatch) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                console.log('Current user', user);
                dispatch({type: USER_LOGGED_IN, payload: {
                    name: user.displayName,
                    email: user.email
                }})
            } else {
                console.log('No user is logged in');
                dispatch({ type: USER_LOGGED_OUT })
            }
        });

        firebase
            .auth()
            .getRedirectResult()
            .then(function(result) {
                const user = result.user;
                if (user) {
                    console.log('You are logged in', user);
                    dispatch({type: USER_LOGGED_IN, payload: {
                        name: user.displayName,
                        email: user.email
                    }})
                    dispatch(getPosts());
                }
            })
            .catch(function(error) {
                console.log(error);
            });
    }
}

export function logInFirebase() {
    return function(dispatch) {
        firebase
            .auth()
            .signInWithRedirect(provider);
    };
}

export function postMessageToFirebase(data) {
    return function(dispatch) {
        // Get a key for a new Post.
        let newPostKey = firebase
            .database()
            .ref()
            .child("messages")
            .push().key;

        let updates = {};
        updates["/messages/" + newPostKey] = data;

        return firebase
            .database()
            .ref()
            .update(updates);
    }
}

function getPosts() {
    return function(dispatch) {
        firebase
            .database()
            .ref("messages/")
            .on("value", messages => {
                let obj = messages.val();
                console.log('Messages', obj);
                let results = Object.keys(messages.val()).map(function(key) {
                    return {id: key, data: obj[key]}
                });
                dispatch({ type: MESSAGES_LOADED, payload: results });
            });
    };
}

export function getDogs(page, filters) {
    return function(dispatch) {
        console.log('Fetching page with filters', page, filters);
        return client.animal.search({type: 'dog', location: 'hawaii', status: 'adoptable', page: page, ...filters})
            .then(response => response.data)
            .then(json => {
                if(page === 1) {
                    dispatch({ type: DOGS_LOADED, payload: {...json, ...{replace: true}} });
                } else {
                    dispatch({ type: DOGS_LOADED, payload: {...json, ...{replace: false}} });
                }
            });
    };
}

export function getOrgs() {
    return function(dispatch) {
        return client.organization.search({state: 'hi'})
            .then(response => response.data)
            .then(json => {
                dispatch({ type: ORGS_LOADED, payload: json });
            });
    };
}

export function getSingleDog(id) {
    return function(dispatch) {
        dispatch({ type: DOG_CLEAR });
        return client.animal.show(id)
            .then(response => response.data)
            .then(json => {
                dispatch({ type: DOGGO_LOADED, payload: json});
            });
    };
}

export function getGif() {
    return function(dispatch){
        dispatch({ type: GIF_CLEAR });

        return fetch('https://api.thedogapi.com/v1/images/search?mime_types=gif', {
            headers: {
                'x-api-key': '9206eb8e-be22-425e-b1f2-ef9aed0e81a5',
            }
        })
        .then(response => response.json())
        .then(json => {
            console.log('gifs', json);
            dispatch({ type: GIF_LOADED, payload: json[0]});
        });
    }
}

export function updateFilter(field, value) {
    return function(dispatch) {
        dispatch({ type: FILTER_UPDATE, payload: {field, value} });
    }
}
