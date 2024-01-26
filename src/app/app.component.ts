// import { WebSocketClientService } from './core/services/websocket-client/web-socket-client.service';
import { DatabaseService } from './core/services/database/database.service';
import { environment } from './../environments/environment';
import { Component, OnInit } from '@angular/core';
// import { AndroidFullScreen } from "@awesome-cordova-plugins/android-full-screen/ngx";
import { createSchema } from './core/utils/db-schemas';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  isWeb = false;
  private initPlugin= false;

  constructor(
    private databaseService : DatabaseService) {

      this.databaseService.openConnection();
  }

  ngOnInit(): void {
    console.log("App initialization", "app.component.ts");
  }
}
