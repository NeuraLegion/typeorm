import {defaultMetadataStorage} from "../../typeorm";
import {EventSubscriberMetadata} from "../../metadata/EventSubscriberMetadata";

/**
 * Classes decorated with this decorator will listen to ORM events and their methods will be triggered when event
 * occurs. Those classes must implement EventSubscriberInterface interface.
 */
export function EventSubscriber() {
    return function (target: Function) {
        defaultMetadataStorage().eventSubscriberMetadatas.add(new EventSubscriberMetadata(target));
    };
}