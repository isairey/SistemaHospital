import { Injectable, Type } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TabRefreshService {
    private eventSubject = new Subject<any>();

    /**
     * Emits an event with the specified data to all subscribers.
     * 
     * This method is used to trigger an event and send data to any components or services 
     * that are subscribed to this event. It uses the `eventSubject` to push the data to 
     * the event stream.
     * 
     * @param data - The data to be emitted, which should be of type `IDynamicTab`. This data 
     *               will be sent to all subscribers of the event.
     */
    emitEvent(data: Type<IDynamicTab>) {
        this.eventSubject.next(data);
    }

    /**
     * Returns an observable that can be subscribed to for receiving emitted events.
     * 
     * This method provides an observable version of the `eventSubject` which components or 
     * services can subscribe to in order to receive updates when an event is emitted. 
     * This method is useful for subscribing to events in a reactive manner.
     * 
     * @returns An `Observable` of type `IDynamicTab` that emits events whenever `emitEvent` 
     *          is called.
     */
    getEvent() {
        return this.eventSubject.asObservable();
    }
}