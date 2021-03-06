const Event = require('../../structures/Event');

module.exports = class ShardReconnect extends Event {
    constructor(...args) {
        super(...args);
    }

    async run(replayed, shardID) {
        this.client.logger.await('Shard %d reconnecting', shardID);
    }
};