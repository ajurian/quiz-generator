/**
 * Generic Pub/Sub Interfaces
 *
 * These interfaces define a generic publish/subscribe pattern for event-driven communication.
 * Implementations can use Redis, WebSockets, or any other messaging system.
 *
 * The interfaces are decoupled from any specific event type, allowing them to be used
 * for various event types across the application.
 */

/**
 * Generic Event Publisher Interface
 *
 * Defines the contract for publishing events to a channel.
 * Implementations handle the actual delivery mechanism.
 *
 * @template TEvent - The type of event to publish
 */
export interface IEventPublisher<TEvent = unknown> {
  /**
   * Publishes an event to a specific channel
   * @param channel - The channel/topic to publish to
   * @param event - The event payload to publish
   */
  publish(channel: string, event: TEvent): Promise<void>;
}

/**
 * Callback function type for event subscription handlers
 */
export type EventHandler<TEvent = unknown> = (
  event: TEvent
) => void | Promise<void>;

/**
 * Unsubscribe function returned by subscribe methods
 */
export type Unsubscribe = () => Promise<void>;

/**
 * Generic Event Subscriber Interface
 *
 * Defines the contract for subscribing to events from a channel.
 * Implementations handle the actual subscription mechanism.
 *
 * @template TEvent - The type of event to receive
 */
export interface IEventSubscriber<TEvent = unknown> {
  /**
   * Subscribes to events on a specific channel
   * @param channel - The channel/topic to subscribe to
   * @param handler - Callback function invoked when an event is received
   * @returns A function to unsubscribe from the channel
   */
  subscribe(
    channel: string,
    handler: EventHandler<TEvent>
  ): Promise<Unsubscribe>;
}

/**
 * Combined Pub/Sub Interface
 *
 * For implementations that provide both publishing and subscribing capabilities.
 *
 * @template TEvent - The type of event to publish/receive
 */
export interface IPubSub<TEvent = unknown>
  extends IEventPublisher<TEvent>, IEventSubscriber<TEvent> {}

/**
 * Event with channel metadata
 *
 * Wraps an event with its source channel information.
 * Useful when subscribing to multiple channels.
 */
export interface ChannelEvent<TEvent = unknown> {
  /** The channel the event was received from */
  channel: string;
  /** The event payload */
  event: TEvent;
}
