import { setFailed, getInput } from '@actions/core';
import { context } from '@actions/github';
import axios from 'axios';

/**
 * check field validity
 * @param {*} field 
 * @param {*} message 
 */
const checkFieldValidity = (field, message) => {
    if (!field) {
        throw Error(message);
    }
}

/**
 * send telegram text message
 * @param {*} token 
 * @param {*} chat_id 
 * @param {*} text 
 * @param {*} thread_id 
 * @param {*} disable_web_page_preview 
 * @param {*} disable_notification 
 */
const sendTextMessage = async (token, chat_id, text, thread_id = null, disable_web_page_preview = false, disable_notification = false) => {
    const URL = new URLSearchParams(`chat_id=${chat_id}`);

    /**
     * append params
     * @param {*} name 
     * @param {*} param 
     */
    const appendFn = (name, param) => {
        if (param) {
            URL.append(name, param);
        }
    }

    appendFn('message_thread_id', thread_id);
    appendFn('disable_web_page_preview', disable_web_page_preview);
    appendFn('disable_notification', disable_notification);
    URL.append('text', text);
    URL.append('parse_mode', 'Markdown');
    URL.append('disable_web_page_preview', true);

    try {
        await axios.get(`/bot${token}/sendMessage`, {
            baseURL: 'https://api.telegram.org',
            params: URL
        });
    } catch (error) {
        console.error('Error Sending Telegram Message', error);
    }
}

/**
 * 
 * get and prevalidate action inputs
 */
const parseAndValidateInputs = () => {

    // get & check inputs and validity 
    const token = getInput('token');
    const to = getInput('to');
    const thread_id = getInput('thread_id');
    const disable_web_page_preview = getInput('disable_web_page_preview') || false;
    const disable_notification = getInput('disable_notification') || false;
    const status = getInput('status');
    const event = getInput('event');

    checkFieldValidity(token, 'Token is not valid');
    checkFieldValidity(to, 'to address is not valid');

    return {
        token, to, thread_id, disable_web_page_preview,
        disable_notification, status, event
    };
}

/**
 * compose our message
 * @param {*} status 
 * @param {*} event 
 * @returns 
 */
const composer = (status, event) => {

    const icons = { "failure": "❗️", "cancelled": "❕", "success": "✅" };
    const action = context?.payload?.action;
    const senderUser = context?.payload?.sender?.login;
    const userURL = context?.payload?.sender?.html_url;

    /**
     * every event has a handler method that returns the corresponding message to the event and it's action
     */
    const enevtHandlers = {
        "issue_comment": {
            fn: () => {
                const { payload: { issue: { html_url, number } } } = context;
                if (action !== 'created') return null;
                return `💬 new comment on [#${number}](${html_url})`;
            }
        },
        "issues": {
            fn: () => {
                const { issue: { number, html_url: issueURL } } = context?.payload;
                if (action === 'assigned') {
                    const { assignee: { login: assineeUserName, html_url: asigneeURL } } = context?.payload;
                    return `📝 issue [#${number}](${issueURL}) has been assigned to [${assineeUserName}](${asigneeURL})`;
                } else if (action === 'labeled') {
                    const { label: { name: labelName, url: labelURL } } = context?.payload;
                    return `🏷️ issue [#${number}](${issueURL}) has been labeled as [${labelName}](${labelURL})`;
                } else {
                    return `🏷️ issue [#${number}](${issueURL}) has been ${action}`;
                }
            }
        },
        "pull_request": {
            fn: () => {
                const { pull_request: { number, html_url: prURL } } = context;
                if (action === 'create') {
                    return `📦 PR [#${number}](${prURL}) has been created`;
                } if (action === 'ready_for_review') {
                    return `📦 PR [#${number}](${prURL}) is now ready for review`;
                } if (action === 'review_requested') {
                    return `📦 review is requested on PR [#${number}](${prURL})`;
                } else {
                    return `📦 PR [#${number}](${prURL}) has been ${action}`;
                }
            }
        },
        "push": {
            fn: () => {
                const { ref, commits, repository: { html_url: repoURL } } = context?.payload;
                const branchName = ref.split('/').reverse()[0];
                const branchURL = `${repoURL}/tree/${branchName}`
                let commitList = ``;
                let index = 1;
                for (let commit of commits) {
                    const { url, message, committer: { name, username } } = commit;
                    const committerURL = `https://github.com/${username}`;
                    commitList += `\n ${index++}- [${message.replace(/[\r\n]+/g, " ")}](${url}) by [${name}](${committerURL})`
                }

                return `🆕 new changes pushed to [${branchName}](${branchURL}) \n total commits: ${commits.length} ${commitList}`;
            }
        },
        "pull_request_review_comment": {
            fn: () => {
                const { pull_request: { number, html_url: prURL } } = context;
                return `📦  PR review comment on [#${number}](${prURL}) has been ${action}`;
            }
        },
        "default": {
            fn: () => {
                return `something went wrong! I couldn't find the event ${event}!`;
            }
        }
    };

    let handledEvent = (enevtHandlers[event]) ? enevtHandlers[event].fn() : enevtHandlers['default'].fn();
    handledEvent += `\n Action by [${senderUser}](${userURL}) \n Action status: ${icons[status]} ${status}`;

    return handledEvent;
}

async function run() {

    // get & check inputs and validity
    const {
        event: Event, status,
        token, to, thread_id, disable_web_page_preview,
        disable_notification } = parseAndValidateInputs();
    const message = composer(status, Event);

    sendTextMessage(token, to, message, thread_id, disable_web_page_preview, disable_notification);
}

run().catch(e => setFailed(e));