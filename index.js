import { setFailed, getInput, info } from '@actions/core';
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

    try {
        await axios.get(`/bot${token}/sendMessage`, {
            baseURL: 'https://api.telegram.org',
            params: URL
        });
    } catch (error) {
        Logger.error('Error Sending Telegram Message');
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
    const actor = getInput('actor');
    const repository = getInput('repository');
    const workflow = getInput('workflow');

    checkFieldValidity(token, 'Token is not valid');
    checkFieldValidity(to, 'to address is not valid');

    return {
        token, to, thread_id, disable_web_page_preview, disable_notification,
        status, event, actor, repository, workflow
    };
}

/**
 * generate event related link
 * @param {*} event 
 * @param {*} repository 
 * @returns 
 */
const generateLink = (e, repository) => {
    const mappings = {
        "issue_comment": "issues",
        "issues": "issues",
        "pull_request": "pulls",
        "pull_request_review_comment": "pulls",
        "push": "commits",
        "project_card": "projects",
    };

    const type = mappings[e.toLowerCase()];
    return `https://github.com/${repository}/${type}/`;

}

/**
 * compose our message
 * @param {*} status 
 * @param {*} event 
 * @param {*} actor 
 * @param {*} repo 
 * @param {*} workflow 
 * @param {*} link 
 * @returns 
 */
const composer = (status, event, actor, repo, workflow, link) => {

    const icons = {
        "failure": "❗️❗️❗️",
        "cancelled": "❕❕❕",
        "success": "✅✅✅"
    };

    console.log('context =>', context);
    info('info =>', context);

    const enevtHandlers = {
        "issue_comment": {
            fn: () => {
                // created, edited, deleted

            }
        }
    };

    const text = `${icons[status]} *${event.toUpperCase()}*
    wassss made at ${repo}
    by ${actor}
    check here [${workflow}](${link}) --
    ${JSON.stringify(context)} `;
    setFailed(new Error(context));
    throw new Error(context);
    return text;
}

async function run() {

    // get & check inputs and validity
    const {
        event: Event, repository, actor, status, workflow,
        token, to, thread_id, disable_web_page_preview,
        disable_notification } = parseAndValidateInputs();
    const link = generateLink(Event, repository);
    const message = composer(status, Event, actor, repository, workflow, link);

    sendTextMessage(token, to, message, thread_id, disable_web_page_preview, disable_notification);
}

run().catch(e => setFailed(e));