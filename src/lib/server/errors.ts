/**
 * Errors that carry an HTTP status and a player-facing message.
 *
 * `message` is written in Thai because it is shown to players verbatim.
 * Lives in its own module so both the game rules and the store can throw it
 * without creating an import cycle between them.
 */
export class RoomError extends Error {
    status: number

    constructor(message: string, status = 400) {
        super(message)
        this.name = 'RoomError'
        this.status = status
    }
}
