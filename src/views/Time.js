'use strict';

import React, {Component} from "react";
import PropTypes from 'prop-types';

export default class Time extends Component {
    static propTypes = {
        time: PropTypes.string.isRequired,
    };

    componentDidMount() {
        this.timer = setInterval(this.tick.bind(this), 1000);
    }

    tick() {
        this.forceUpdate();
    }

    componentWillUnmount() {
        clearInterval(this.timer);
        this.timer = undefined;
    }

    render() {
        const {time, ...forwardProps} = this.props;
        let diff = new Date() - new Date(time);
        if (diff < 0) {
            // Future date shouldn't happen
            diff = 0;
        }
        let age;
        let timerInterval;
        const days = Math.trunc(diff / 1000 / 60 / 60 / 24);
        if (days > 0) {
            age = days + "d";
            timerInterval = 1000 * 60 * 60;
        } else {
            const hours = Math.trunc(diff / 1000 / 60 / 60);
            if (hours > 0) {
                age = hours + "h";
                timerInterval = 1000 * 60 * 15;
            } else {
                const minutes = Math.trunc(diff / 1000 / 60);
                if (minutes > 0) {
                    age = minutes + "min";
                    timerInterval = 1000 * 15;
                } else {
                    const seconds = Math.trunc(diff / 1000);
                    age = seconds + "s";
                    timerInterval = 1000;
                }
            }
        }
        if (this.timer != undefined) {
            clearInterval(this.timer);
            this.timer = setInterval(this.tick.bind(this), timerInterval);
        }
        return (
            <div className="time">
                {age}
            </div>
        );
    }
};