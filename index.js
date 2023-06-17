import { setFailed, getInput } from '@actions/core';
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
const sendTextMessage = (token, chat_id, text, thread_id = null, disable_web_page_preview = false, disable_notification = false) => {
    const URL = new URLSearchParams(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat_id}`);

    /**
     * append params
     * @param {*} name 
     * @param {*} param 
     */
    const appendFn = (name, param) => {
        if (param) {
            URL.append(name, thread_id);
        }
    }

    appendFn('message_thread_id', thread_id);
    appendFn('disable_web_page_preview', disable_web_page_preview);
    appendFn('disable_notification', disable_notification);

    URL.append('text', text);

    try {
        axios.get(URL.toString());
    } catch (error) {
        Logger.error('Error Sending Telegram Message');
    }
}

async function run() {

    // get & check inputs and validity 
    const token = getInput('token');
    const to = getInput('to');
    const thread_id = getInput('thread_id');
    const text = getInput('text');
    const disable_web_page_preview = getInput('disable_web_page_preview') || false;
    const disable_notification = getInput('disable_notification') || false;

    checkFieldValidity(token, 'Token is not valid');
    checkFieldValidity(to, 'to address is not valid');
    checkFieldValidity(text, 'text is not valid');

    sendTextMessage(token, to, encodeURI('text'), thread_id, disable_web_page_preview, disable_notification);
}

run().catch(e => setFailed(e));