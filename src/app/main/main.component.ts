import { Login } from './../core/models/login';
// import { WebSocketClientService } from './../core/services/websocket-client/web-socket-client.service';
import { DatabaseService} from './../core/services/database/database.service';
import { WaterVolumes, WorkExecution } from './../core/models/work-execution';
import { SocketData, WorkExecutionConfiguration } from './../core/models/models';
import { SocketEvent, WorkDataChange, WorkStatusChange, config} from './../core/utils/global';
import { Person } from './../core/models/person';
import { environment } from './../../environments/environment';
import { Component, OnInit, ViewChild,AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { AlertController, IonLoading,AlertInput } from '@ionic/angular';
import Swal from 'sweetalert2';
import { SettingsComponent } from './settings/settings.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit,AfterViewInit{
  peopleData : Person[] = [];
  @ViewChild('loader') loader!: IonLoading;
  loading_message = 'Verificando configuraciones...';
  lastWorkExecution: WorkExecution | null = null;
  // login: Array<Login> = [];
  login : Login  | null = null;
  // workerData : Person  | null = null;
  supervisorData : Person  | null = null;

  workStatus : WorkStatusChange = WorkStatusChange.STOP;
  classButtonPower = "power-button-off";
  islocalServerConnected : boolean = false; //Status of websocket connection (local server)

  alertInputs : any = [
    {
      label: "Nuevo volumen",
      type: 'number' as any,
      placeholder: '1000',
      id:'txt_vol',
      name : 'txt_vol',
      min: 1,
      attributes : {
        required: true
      }
    },
  ];

  constructor(private databaseService: DatabaseService,
    private router: Router,
    private alertController : AlertController,
    private route : ActivatedRoute,
    public alerta: SettingsComponent
    ) {
      console.log(this.login, "main.component... constructor");

     }


  async ngOnInit() {
    await this.databaseService.openConnection();

    this.login = await this.databaseService.getLogin();

    console.log(this.login, "main.component");
    this.lastWorkExecution = await this.databaseService.getLastWorkExecution();
  }

  async openIfNotConnected(){

    await this.databaseService.openConnection();
    // if(!this.databaseService.db){
    // }
    // else{
    //   // let isOpenDatabase = await this.databaseService.db.isDBOpen();
    //   // console.log(isOpenDatabase);
    //   //if(!isOpenDatabase)
    // }
  }

  async ngAfterViewInit() {

    this.loadPersonValues();

    if(this.lastWorkExecution){
      this.loading_message = 'Verificando configuraciones...';
      await this.loader.present();
    }
  }

  async loadPersonValues(){
    await this.openIfNotConnected();

    await this.databaseService.getLastWorkExecution()
    .then((result : WorkExecution) => {
      if(result?.sended)
        this.lastWorkExecution = result;
    })
    .catch((error) => {
      this.alerta.mostrarAlertaChica("<p>Hubo un error al cargar el último trabajo configurado.</p>")
      console.log(error);
    });

    //  ------------------------------------------------------------------

    await this.databaseService.getLogin().then((result) => {
      this.login = result;
      console.log(this.login, "await database");
    })
    .catch((error)=>{
      console.log(error);
    });

    // if(this.cookieService.check("session"))
    // {
    //   this.login = this.peopleData.find(p => p.id == parseInt(this.cookieService.get("session")))!;
    // }
    // else if(this.lastWorkExecution)
    // {
    //   this.workerData = this.peopleData.find(p => p.id == this.lastWorkExecution?.worker)!;
    // }


    // if(this.cookieService.check("supervisor")){
    //   this.supervisorData = this.peopleData.find(p => p.id == parseInt(this.cookieService.get("supervisor")))!;
    // }

    // await this.databaseService.closeConnection(environment.dbName, false);
  }

  get currentRoute(): string{
    return this.router.url;
  }

  changeStatusExecution(){

  }

  cerrarSesion(){
    // this.cookieService.delete("session",'/');
    // this.cookieService.delete("supervisor",'/');
    this.router.navigate(['/','login']);
  }

  private listenTime : moment.Moment = moment();
  onStartListenPower($event : any){
    this.listenTime = moment();
  }


  async onClickPower(){
    console.log(this.lastWorkExecution, "dio click al boton verde");
    // console.log(this.loadPersonValues, "person values");
    if(!this.lastWorkExecution)
      this.loadPersonValues();
    let command : SocketData = {
      event:SocketEvent.WORK_STATUS_CHANGES,
      type: WorkStatusChange.STOP,
      data : {id : this.lastWorkExecution!.id}
    };

    console.log(command, "array de socket data");

    // Start/Pause
    command.type = this.workStatus == WorkStatusChange.STOP ? WorkStatusChange.START : WorkStatusChange.STOP;
    console.log(command.type, "command type");

    /*In this case the pause option will not be enabled, it will pause only when the volume of water in the tank is close to empty,
    then it will be the moment when the operator finishes the work application or fills the tank again, if so, once the tank is filled,
    the new volume of water in the tank must be entered.*/

    if (command.type == WorkStatusChange.START){
      this.alertController.create({
        header: 'Iniciar/Reiniciar aplicaciòn de trabajo',
        subHeader: 'Volumen de aplicaciòn',
        message: `Digite el volumen en litros (L) actual.`,
        inputs: this.alertInputs,
        backdropDismiss : false,
        buttons: [
          {
            text: 'Confirmar',
            handler: async (event) => {
              console.log(event, "event");
              let val = parseFloat(event.txt_vol);
              console.log(val, "val confirmar");
              if (val){

                await this.openIfNotConnected();
                let volume : WaterVolumes = { id :0 ,volume: val,work_exec_id : this.lastWorkExecution!.id };
                // console.log(volume, "volume");
                let conf = JSON.parse(this.lastWorkExecution!.configuration) as WorkExecutionConfiguration;
                conf.volume += val;
                console.log(volume, this.lastWorkExecution!, "info a guardar");
                this.lastWorkExecution!.configuration = JSON.stringify(conf);
                await this.databaseService.saveWaterVolumes(volume,this.lastWorkExecution!);
                // console.log(this.databaseService.saveWaterVolumes(volume,this.lastWorkExecution!));
                // await this.databaseService.closeDB();
                command.data.current_volume = val;
                console.log(command.data.current_volume, "comand data");
                this.loading_message = "Cargando...";
                this.loader.present();
                return true;
              }
              else return false;
            }
          },
          {
            text: 'Cancelar',
            role : 'cancel',
            handler: () => {
              console.log('Let me think');
            }
          },
        ]
      })

      .then((res) => {
        res.present();
      });
    }
  }

  async onEndListenPower($event: any){
    let endTime : moment.Moment = moment();

    let diff = endTime.diff(this.listenTime,"milliseconds");
    if(diff < 10) return;

    let command : SocketData = {
      event:SocketEvent.WORK_STATUS_CHANGES,
      type: WorkStatusChange.STOP,
      data : {id : this.lastWorkExecution!.id}
    }

    if(diff > 1000) {
      //Confirm and finish the work execution
      this.alertController.create({
        header: '¡Atención!',
        subHeader: 'Finalizar Aplicación',
        message: `¿Está seguro que desea finalizar la aplicación de trabajo?`,
        buttons: [
          {
            text: 'Si',
            handler: () => {
              this.loading_message = 'Finalizando aplicación...';
              this.loader.present();
              command.type = WorkStatusChange.FINISH;
            }
          },
          {
            text: 'No',
            handler: () => {
              console.log('Let me think');
            }
          },
        ]
      }).then((res) => {
        res.present();
      });
    }
  }

  get canStart(): boolean{
    if(this.lastWorkExecution){
      return this.lastWorkExecution.configuration != "";
    }
    return false;
  }
}
