import * as createHmac from 'create-hmac';
import * as request from 'superagent';

import Settings from '../app/settings';
import {Color} from '../enums/Color';
import {PostListSortType} from '../enums/PostListSortType';
import {UserType} from '../enums/UserType';

const API_PATH_V2 = '/v2';
const API_PATH_V3 = '/v3';

function parseUrl(url: string) {
    const parser = document.createElement('a');
    parser.href = url;
    return parser;
}

function computeSignature(auth: string | undefined, method: string, url: string, timestamp: string, data: string) {
    const u = parseUrl(url);
    let path = u.pathname;
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    const raw = method + '%' + u.hostname + '%' + 443 + '%' + path + '%' + (auth || '') + '%' + timestamp + '%' + '' +
        '%' + data;

    const hmac = createHmac('sha1', Settings.KEY);
    hmac.setEncoding('hex');
    hmac.write(raw);
    hmac.end();
    return hmac.read();
}

/**
 * Create a new android gcm account
 * @returns {Promise<request.Response>}
 */
export function getGcmAndroidAccount() {
    return new Promise<request.Response>((resolve, reject) => {
        const req = request('GET', Settings.GCM_ACCOUNT_HELPER_URL)
            .set('Accept', 'application/json');

        req.send()
            .end((err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
    });
}

/**
 * Receive the gcm push verification sent by the jodel server via GCM
 * @param {{android_id: string; security_token: string}} androidAccount
 * @returns {Promise<request.Response>}
 */
export function receiveGcmPushVerification(androidAccount: { android_id: string, security_token: string }) {
    return new Promise<request.Response>((resolve, reject) => {
        const req = request('POST', Settings.GCM_RECEIVE_HELPER_URL)
            .type('json')
            .set('Content-Type', 'application/json; charset=UTF-8');

        req.send(JSON.stringify(androidAccount))
            .end((err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
    });
}

export function jodelRequest(auth: string | undefined, method: string, url: string, query: object | string, data: any) {
    return new Promise<request.Response>((resolve, reject) => {
        const dataString = JSON.stringify(data);
        const timestamp = new Date().toISOString();
        const sig = computeSignature(auth, method, url, timestamp, dataString);

        const req = request(method, url)
            .query(query)
            .type('json')
            .set('Accept', 'application/json')
            .set('X-Client-Type', Settings.CLIENT_TYPE)
            .set('X-Api-Version', '0.2')
            .set('X-Timestamp', timestamp)
            .set('X-Authorization', 'HMAC ' + sig.toString())
            .set('Content-Type', 'application/json; charset=UTF-8');

        if (auth) {
            req.set('Authorization', 'Bearer ' + auth);
        }

        req.send(dataString)
            .end((err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
    });
}

/*export function apiGetPosts(callback) {
 return jodelRequest("GET", Settings.API_SERVER + API_PATH_V2 + "/posts/", {}, {});
 }*/

export function apiGetPostsCombo(auth: string, latitude: number, longitude: number, stickies = true, home = false) {
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V3 + '/posts/location/combo', {
        home,
        lat: latitude,
        lng: longitude,
        stickies,
    }, {});
}

export function apiGetPosts(auth: string, sortType: PostListSortType, afterPostId: string | undefined, latitude: number,
                            longitude: number, home = false) {
    let type;
    switch (sortType) {
        case PostListSortType.RECENT:
            type = '';
            break;
        case PostListSortType.DISCUSSED:
            type = 'discussed';
            break;
        case PostListSortType.POPULAR:
            type = 'popular';
            break;
        default:
            throw new Error('Unknown sort type');
    }
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V2 + '/posts/location/' + type, {
        after: afterPostId,
        home,
        lat: latitude,
        lng: longitude,
    }, {});
}

export function apiGetPostsMineCombo(auth: string) {
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V2 + '/posts/mine/combo', {}, {});
}

export function apiGetPostsMine(auth: string, sortType: PostListSortType, skip?: number, limit?: number) {
    let type;
    switch (sortType) {
        case PostListSortType.RECENT:
            type = '';
            break;
        case PostListSortType.DISCUSSED:
            type = 'discussed';
            break;
        case PostListSortType.POPULAR:
            type = 'popular';
            break;
        default:
            throw new Error('Unknown sort type');
    }
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V2 + '/posts/mine/' + type, {
        limit,
        skip,
    }, {});
}

export function apiGetPostsMineReplies(auth: string, skip?: number, limit?: number) {
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V2 + '/posts/mine/replies', {
        limit,
        skip,
    }, {});
}

export function apiGetPostsMinePinned(auth: string, skip?: number, limit?: number) {
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V2 + '/posts/mine/pinned', {
        limit,
        skip,
    }, {});
}

export function apiGetPostsMineVotes(auth: string, skip?: number, limit?: number) {
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V2 + '/posts/mine/votes', {
        limit,
        skip,
    }, {});
}

export function apiGetPostsChannelCombo(auth: string, channel: string, home = false) {
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V3 + '/posts/channel/combo', {channel, home}, {});
}

export function apiGetPostsChannel(auth: string, sortType: PostListSortType, afterPostId: string | undefined,
                                   channel: string, home = false) {
    let type;
    switch (sortType) {
        case PostListSortType.RECENT:
            type = '';
            break;
        case PostListSortType.DISCUSSED:
            type = 'discussed';
            break;
        case PostListSortType.POPULAR:
            type = 'popular';
            break;
        default:
            throw new Error('Unknown sort type');
    }
    const query = {
        after: afterPostId,
        channel,
        home,
    };
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V3 + '/posts/channel/' + type, query, {});
}

export function apiGetPostsHashtagCombo(auth: string, hashtag: string, home = false) {
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V3 + '/posts/hashtag/combo', {hashtag, home}, {});
}

export function apiGetPostsHashtag(auth: string, sortType: PostListSortType, afterPostId: string | undefined,
                                   hashtag: string, home = false) {
    let type;
    switch (sortType) {
        case PostListSortType.RECENT:
            type = '';
            break;
        case PostListSortType.DISCUSSED:
            type = 'discussed';
            break;
        case PostListSortType.POPULAR:
            type = 'popular';
            break;
        default:
            throw new Error('Unknown sort type');
    }
    const query = {
        after: afterPostId,
        hashtag,
        home,
    };
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V3 + '/posts/hashtag/' + type, query, {});
}

export function apiGetPost(auth: string, postId: string) {
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V2 + '/posts/' + postId, {}, {});
}

export function apiGetPostDetails(auth: string, postId: string, details = true, nextReply: string | undefined,
                                  reversed = false) {
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V3 + '/posts/' + postId + '/details', {
        details,
        reply: nextReply,
        reversed,
    }, {});
}

export function apiDeletePost(auth: string, postId: string) {
    return jodelRequest(auth, 'DELETE', Settings.API_SERVER + API_PATH_V2 + '/posts/' + postId, {}, {});
}

export function apiUpVote(auth: string, postId: string) {
    return jodelRequest(auth, 'PUT', Settings.API_SERVER + API_PATH_V2 + '/posts/' + postId + '/upvote', {},
        {reason_code: -1});
}

export function apiDownVote(auth: string, postId: string) {
    return jodelRequest(auth, 'PUT', Settings.API_SERVER + API_PATH_V2 + '/posts/' + postId + '/downvote', {},
        {reason_code: -1});
}

export function apiGiveThanks(auth: string, postId: string) {
    return jodelRequest(auth, 'POST', Settings.API_SERVER + API_PATH_V3 + '/posts/' + postId + '/giveThanks', {}, {});
}

export function apiPin(auth: string, postId: string) {
    return jodelRequest(auth, 'PUT', Settings.API_SERVER + API_PATH_V2 + '/posts/' + postId + '/pin', {}, {});
}

export function apiUnpin(auth: string, postId: string) {
    return jodelRequest(auth, 'PUT', Settings.API_SERVER + API_PATH_V2 + '/posts/' + postId + '/unpin', {}, {});
}

export function apiFollowChannel(auth: string, channel: string) {
    return jodelRequest(auth, 'PUT', Settings.API_SERVER + API_PATH_V3 + '/user/followChannel', {channel}, {});
}

export function apiUnfollowChannel(auth: string, channel: string) {
    return jodelRequest(auth, 'PUT', Settings.API_SERVER + API_PATH_V3 + '/user/unfollowChannel', {channel}, {});
}

export function apiGetRecommendedChannels(auth: string, home = false) {
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V3 + '/user/recommendedChannels', {home}, {});
}

export function apiGetFollowedChannelsMeta(auth: string, channels: { [channelName: string]: number }, home = false) {
    // Format: {"channelName": timestamp, "channel2": timestamp2}
    return jodelRequest(auth, 'POST', Settings.API_SERVER + API_PATH_V3 + '/user/followedChannelsMeta', {home},
        channels);
}

export function apiGetSuggestedHashtags(auth: string, home = false) {
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V3 + '/hashtags/suggested', {home}, {});
}

export function apiAddPost(auth: string, channel: string | undefined, ancestorPostId: string | undefined,
                           color: Color | undefined, locAccuracy: number, latitude: number, longitude: number,
                           city: string, country: string, message: string, image: string | undefined, toHome = false) {
    // image must be base64 encoded string
    return jodelRequest(auth, 'POST', Settings.API_SERVER + API_PATH_V3 + '/posts/', {}, {
        ancestor: ancestorPostId,
        channel,
        color,
        image,
        location: {
            city,
            country,
            loc_accuracy: locAccuracy,
            loc_coordinates: {lat: latitude, lng: longitude},
            name: city,
        },
        message,
        to_home: toHome,
    });
}

export function apiGetConfig(auth: string) {
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V3 + '/user/config', {}, {});
}

export function apiGetKarma(auth: string) {
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V2 + '/users/karma', {}, {});
}

/**
 * Request a link to the verification image captcha
 * expected data from server: {key: String, image_url: String, image_size: Number}
 * @param auth
 * @returns {Promise}
 */
export function apiGetImageCaptcha(auth: string) {
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V3 + '/user/verification/imageCaptcha', {}, {});
}

/**
 * Send the user's answer back to the server
 * expected data from server: {verified: Boolean}
 * @returns {Promise}
 */
export function apiSendVerificationAnswer(auth: string, key: string, answer: number[]) {
    return jodelRequest(auth, 'POST', Settings.API_SERVER + API_PATH_V3 + '/user/verification/imageCaptcha', {}, {
        answer,
        key,
    });
}

export function apiSetLocation(auth: string, latitude: number, longitude: number, city: string, country: string) {
    const data = {
        location: {
            city,
            country,
            loc_accuracy: 0.0,
            loc_coordinates: {
                lat: latitude,
                lng: longitude,
            },
            name: city,
        },
    };
    return jodelRequest(auth, 'PUT', Settings.API_SERVER + API_PATH_V2 + '/users/location', {}, data);
}

export function apiSetHome(auth: string, latitude: number, longitude: number, city: string, country: string) {
    const data = {
        location: {
            city,
            country,
            loc_accuracy: 0.0,
            loc_coordinates: {
                lat: latitude,
                lng: longitude,
            },
            name: city,
        },
    };
    return jodelRequest(auth, 'PUT', Settings.API_SERVER + API_PATH_V3 + '/user/home', {}, data);
}

export function apiDeleteHome(auth: string) {
    return jodelRequest(auth, 'DELETE', Settings.API_SERVER + API_PATH_V3 + '/user/home', {}, {});
}

export type ApiAction = 'SetHomeStarted' | 'SetHomeCompleted' | 'NewestFeedSelected' | 'MostCommentedFeedSelected';

export function apiSetAction(auth: string, action: ApiAction) {
    const data = {
        action,
    };
    return jodelRequest(auth, 'POST', Settings.API_SERVER + API_PATH_V3 + '/action', {}, data);
}

/**
 * Send Gcm Push token to Jodel server, which will then send a verification code via GCM
 * @param {string} auth
 * @param {string} clientId Fixed Jodel android client id
 * @param {string} pushToken Gcm push token
 * @returns {Promise<request.Response>}
 */
export function apiSetPushToken(auth: string, clientId: string, pushToken: string) {
    const data = {
        client_id: clientId,
        push_token: pushToken,
    };
    return jodelRequest(auth, 'PUT', Settings.API_SERVER + API_PATH_V2 + '/users/pushToken', {}, data);
}

export function apiVerifyPush(auth: string, serverTime: number, verificationCode: string) {
    // Verify GCM push
    const data = {
        server_time: serverTime,
        verification_code: verificationCode,
    };
    return jodelRequest(auth, 'POST', Settings.API_SERVER + API_PATH_V3 + '/user/verification/push', {}, data);
}

export function apiGetAccessToken(deviceUid: string, latitude = 0.0, longitude = 0.0, city: string, country: string) {
    const data = {
        client_id: Settings.CLIENT_ID,
        device_uid: deviceUid,
        location: {
            city,
            country,
            loc_accuracy: 0.0,
            loc_coordinates: {
                lat: latitude,
                lng: longitude,
            },
        },
    };
    return jodelRequest(undefined, 'POST', Settings.API_SERVER + API_PATH_V2 + '/users/', {}, data);
}

export function apiRefreshAccessToken(auth: string, distinctId: string, refreshToken: string) {
    const data = {
        current_client_id: Settings.CLIENT_ID,
        distinct_id: distinctId,
        refresh_token: refreshToken,
    };
    return jodelRequest(auth, 'POST', Settings.API_SERVER + API_PATH_V2 + '/users/refreshToken', {}, data);
}

export function apiIsNotificationAvailable(auth: string) {
    return jodelRequest(auth, 'GET', Settings.API_SERVER + API_PATH_V3 + '/user/notifications/new', {}, {});
}

export function apiGetNotifications(auth: string) {
    return jodelRequest(auth, 'PUT', Settings.API_SERVER + API_PATH_V3 + '/user/notifications', {}, {});
}

export function apiSetNotificationPostRead(auth: string, postId: string) {
    return jodelRequest(auth, 'PUT', Settings.API_SERVER + API_PATH_V3 + '/user/notifications/post/' + postId + '/read',
        {}, {});
}

/**
 * Set the user's language on the server
 * @param auth
 * @param language Language name in ISO 639-1 format, e.g. 'de'
 */
export function apiSetUserLanguage(auth: string, language: string) {
    return jodelRequest(auth, 'PUT', Settings.API_SERVER + API_PATH_V3 + '/user/language', {}, {language});
}

/**
 * Set the user's language on the server
 * @param {string} auth
 * @param {string} userType User profile type, e.g. student
 * @param {Number} [age] User's age
 * @returns {*}
 */
export function apiSetUserProfile(auth: string, userType: UserType, age = 0) {
    const data = {
        age,
        user_type: userType,
    };
    return jodelRequest(auth, 'PUT', Settings.API_SERVER + API_PATH_V3 + '/user/profile', {}, data);
}

/**
 * Share a post, the server generates a url that can be shared.
 * @param {string} auth
 * @param {number} postId The postId you want to share
 * @returns {*} a server generated url
 */
export function apiSharePost(auth: string, postId: string) {
    return jodelRequest(auth, 'POST', Settings.API_SERVER + API_PATH_V3 + '/posts/' + postId + '/share', {}, {});
}

export function apiSearchPosts(auth: string, message: string, suggested = false,
                               home = false): Promise<request.Response> {
    const data = {
        message,
        suggested,
    };
    return jodelRequest(auth, 'POST', Settings.API_SERVER + API_PATH_V3 + '/posts/search', {home}, data);
}
