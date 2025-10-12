import React from 'react';

/**
 * RequiresHook
 *
 * An abstract class that requires a setState function to be passed in the constructor.
 * This is useful for classes that need to update state in a React component or similar environment.
 * The setState function should follow the same principle as React's useState hook, where it can accept either a new state object or a function that returns a new state object.
 */
export abstract class RequiresHook<T> {

  /**
   * constructor
   *
   * setState is a function that (could be) from a React useState hook, but this extends to any state management library; as long as it follows the same principle that setState can trigger a re-render.
   */
  public constructor(
    protected readonly _setState: React.Dispatch<React.SetStateAction<T>>
  ) { }


  protected setState(update: T): void {
    this._setState(update);
  }

  protected propagate<O extends RequiresHook<any>>(self: O) {
    // Only propagate if a setState hook is provided
    if (typeof this._setState === 'function') {
      console.dInfo(`Propagating state change for`, self);
      this._setState(self as unknown as T);
    }
  }

}
