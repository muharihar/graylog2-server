/**
 * Copyright 2012 Lennart Koopmann <lennart@socketfeed.com>
 *
 * This file is part of Graylog2.
 *
 * Graylog2 is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Graylog2 is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Graylog2.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

package org.graylog2.filters;

import com.yammer.metrics.Metrics;
import com.yammer.metrics.core.Timer;
import com.yammer.metrics.core.TimerContext;
import org.graylog2.plugin.GraylogServer;
import org.graylog2.plugin.MessageCounter;
import org.graylog2.plugin.filters.MessageFilter;
import org.graylog2.plugin.logmessage.LogMessage;
import org.graylog2.plugin.streams.Stream;

import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.graylog2.Core;
import org.graylog2.MessageCounterImpl;
/**
 * @author Lennart Koopmann <lennart@socketfeed.com>
 */
public class CounterUpdateFilter implements MessageFilter {

    private final Timer processTime = Metrics.newTimer(CounterUpdateFilter.class, "ProcessTime", TimeUnit.MICROSECONDS, TimeUnit.SECONDS);

    @Override
    public boolean filter(LogMessage msg, GraylogServer server) {
        Core serverImpl = (Core) server;
        TimerContext tcx = processTime.time();

        // Increment all registered message counters.
        for (Map<Integer, MessageCounter> counters : serverImpl.getMessageCounterManager().getAllCounters().values()) {

            //Get the message TS with precision to the second (base unit of all periodical threads)
            Integer counterTimestamp = Integer.valueOf(Double.valueOf(Math.floor(msg.getCreatedAt() / 1000)).intValue());

            MessageCounter counter = counters.get(counterTimestamp);
            if (counter == null) {
                counter = new MessageCounterImpl();
                counters.put(counterTimestamp, counter);
            }

            // Total count.
            counter.incrementTotal();

            // Stream counts.
            for (Stream stream : msg.getStreams()) {
                counter.incrementStream(stream.getId());
            }

            // Host count.
            counter.incrementHost(msg.getHost());
        }

        // Update hostcounters. Used to build hosts connection.
        serverImpl.getHostCounterCache().increment(msg.getHost());

        tcx.stop();
        return false;
    }

    @Override
    public String getName() {
        return "CounterUpdater";
    }

}
