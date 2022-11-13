import JaHollDEApplication from "./app";
import { Menu, nativeImage, Tray } from "electron";
import path from "path";

export class TrayManager {
  private tray!: Tray;

  constructor(private application: JaHollDEApplication) {
    this.init();
    application.socket.onUpdate.subscribe((data) => this.onInstanceUpdate(data));
  }

  private init(): void {
    const isDev = process.env.NODE_ENV === 'development';

    const RESOURCE_DIR = isDev ? __dirname : path.join(__dirname, '../build');
    const iconPath = path.join(RESOURCE_DIR, 'logo_32x32.png');
    const nimage = nativeImage.createFromPath(iconPath);

    this.tray = new Tray(nimage);

    this.onInstanceUpdate([]);

    this.tray.setToolTip('JaHollDELauncher');
    this.tray.on('double-click', () => this.application.mainWindow?.show());
  }

  public onInstanceUpdate(data: string[]): void {
    const trayMenuTemplate = [
      {
        label: 'JaHollDELauncher',
        enabled: false
      },
      {
        label: 'Show Dev Tools',
        click: () => this.application.mainWindow?.webContents.openDevTools()
      },
      {
        label: 'Launcher Schließen',
        click: () => {
          this.application.mainWindow?.close();
          process.exit(0);
        }
      }
    ];


    data.forEach(element => {
      trayMenuTemplate.push({
        label: `${element}: Overlay neustarten`,
        click: () => {
          this.application.socket.getInstanceByName(element)?.destroy(true);
        }
      });
    });

    const trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
    this.tray.setContextMenu(trayMenu);
  }
}