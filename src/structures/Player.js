const { VoiceConnection, TrackPlayer } = require('yasha');
const { MessageEmbed } = require('discord.js');

const Queue = require('./Queue');
const { Filter } = require('./Filter');

module.exports = class Player extends TrackPlayer {

    constructor(options) {
        super();

        this.manager = options.manager;

        this.trackRepeat = false;
        this.queueRepeat = false;

        this.stayInVoice = false;

        this.position = 0;
        this.playing = false;
        this.paused = false;
        this.volume = options.volume ? options.volume : 100;

        this.queue = new Queue();

        if (this.manager.players.has(options.guild.id)) {
            return this.manager.players.get(options.guild.id);
        }

        this.voiceChannel = options.voiceChannel;
        this.textChannel = options.textChannel;
        this.guild = options.guild;
    }

    async connect() {
        this.connection = await VoiceConnection.connect(
            this.voiceChannel,
            {
                self_deaf: true,
            },
        );
        this.subscription = this.connection.subscribe(this);

        this.connection.on(VoiceConnection.Status.Destroyed, () => {
            this.destroy();
        });

        this.connection.on('error', (error) => {
            this.manager.logger.error(error);
        });
    }

    disconnect() {
        if (this.connection) this.connection.disconnect();
    }

    play(track) {
        if (!track) {
            super.play(this.queue.current);
        }
        else {
            super.play(track);
        }
        this.start();
        this.setVolume(this.volume);
        if (this.filter) this.filter.on();
    }

    skip() {
        this.manager.trackEnd(this);
    }

    get(key) {
        return this[key];
    }

    set(key, value) {
        this[key] = value;
    }

    setFilter(filter) {
        if (this.filter) this.filter.off();
        this.filter = filter;
        filter.on();
    }

    resetFilter() {
        if (this.filter) this.filter.off();
        this.filter = null;
    }

    resetAllFilters() {
        new Filter(this).off();
        this.filter = null;
    }

    setVolume(volume) {
        if (volume > 100000) volume = 100000;
        super.setVolume(volume / 100);
    }

    setBitrate(bitrate) {
        super.setBitrate(bitrate);
    }

    setRate(rate) {
        super.setRate(rate);
    }

    setTempo(tempo) {
        super.setTempo(tempo);
    }

    setTremolo(depth, rate) {
        super.setTremolo(depth, rate);
    }

    setEqualizer(equalizer) {
        super.setEqualizer(equalizer);
    }

    getTime() {
        return super.getTime();
    }

    getDuration() {
        return super.getDuration();
    }

    destroy() {
        if (this.stayInVoice) return;

        if (this.nowPlayingMessage) clearInterval(this.nowPlayingMessage.interval);
        if (this.connection) this.disconnect();
        super.destroy();

        this.manager.players.delete(this.guild.id);
    }

    setTrackRepeat(repeat) {
        if (repeat) {
            this.trackRepeat = true;
            this.queueRepeat = false;
        }
        else {
            this.trackRepeat = false;
            this.queueRepeat = false;
        }

        return this;
    }

    setQueueRepeat(repeat) {
        if (repeat) {
            this.trackRepeat = false;
            this.queueRepeat = true;
        }
        else {
            this.trackRepeat = false;
            this.queueRepeat = false;
        }

        return this;
    }

    pause(pause) {
        const embed = new MessageEmbed(this.nowPlayingMessage.embeds[0].setAuthor(this.queue.current.author, this.pause ? 'https://eartensifier.net/images/cd.png' : 'https://eartensifier.net/images/cd.gif', this.queue.current.url));
        this.nowPlayingMessage.edit({ content: null, embeds: [embed] });

        if (this.paused === pause || !this.queue.totalSize) return this;

        this.playing = !pause;
        this.paused = pause;

        this.setPaused(pause);

        return this;
    }

    seek(time) {
        if (!this.queue.current) return undefined;
        time = Number(time);

        if (time < 0 || time > this.queue.current.duration)
            time = Math.max(Math.min(time, this.queue.current.duration), 0);

        super.seek(time);
    }
};