export default class OnScreenUpdate {
    application;
    name = "screen_update";
    constructor(application) {
        this.application = application;
    }
    run(jsonMessage, socketInstance) {
        const width = jsonMessage.width;
        const height = jsonMessage.height;
        const x = jsonMessage.x;
        const y = jsonMessage.y;
        socketInstance.window.setGeometry(width, height, x, y);
    }
}
