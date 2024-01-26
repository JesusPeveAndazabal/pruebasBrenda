import { ArduinoService } from './../../core/services/arduino/arduino.service';
import { WorkExecutionData } from './../../core/models/we-data';
import { SocketData, WorkExecutionConfiguration } from './../../core/models/models';
import { LocalConf } from './../../core/models/local_conf';
// import { WebSocketClientService } from './../../core/services/websocket-client/web-socket-client.service';
import { DatabaseService } from './../../core/services/database/database.service';
import { WorkExecution } from './../../core/models/work-execution';
import { Component, OnInit } from '@angular/core';
// import { environment } from 'src/environments/environment';
import { Sensor, SocketEvent, UnitPressureEnum, WorkStatusChange, convertPressureUnit,config } from './../../core/utils/global';

@Component({
  selector: 'app-control',
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.scss'],
})
export class ControlComponent  implements OnInit {
  wConfig : WorkExecutionConfiguration | undefined;
  wExecution! : WorkExecution;
  localConfig! : LocalConf;
  leftControlActive : boolean = false;
  rightControlActive : boolean = false;
  currentVolume: number = 100;
  pressure : number = 0;
  waterFlow : number = 0;
  volume : number = 0;
  maxVolume : number = 0;
  speed : number = 0;
  currentPh : number = 0;
  minVolume: number = 0;
  wFlowAlert : boolean = false;
  pressureAlert : boolean = false;
  info: number = 0;
  constructor(private dbService : DatabaseService, private arduinoService :ArduinoService) {

  }

  async ngOnInit() {
    this.wExecution = await this.dbService.getLastWorkExecution();
    this.localConfig = await this.dbService.getLocalConfig();
    this.info = JSON.parse((await this.dbService.getLastWorkExecution()).configuration).pressure;
    console.log(this.info, "teoric_pressure");
    //CAUDAL
    this.arduinoService.getSensorObservable(Sensor.WATER_FLOW).subscribe((valorDelSensor) => {
      // console.log(valorDelSensor, "caudal");
      this.waterFlow = valorDelSensor;
    });

    //PRESSURE - PRESION
    this.arduinoService.getSensorObservable(Sensor.PRESSURE).subscribe((valorDelSensor) => {
      console.log("Valor de la presion" , valorDelSensor);
      this.pressure = valorDelSensor;
    });

    //VOLUMEN
    this.arduinoService.getSensorObservable(Sensor.VOLUME).subscribe((valorDelSensor) => {
      console.log('Nuevo valor del sensor Volumen:', valorDelSensor);
      this.volume = this.currentVolume - valorDelSensor;

      if (this.volume < this.minVolume){
        alert("Debe rellenar el tanque - Valvulas cerradas");
        this.arduinoService.deactivateRightValve();
        this.arduinoService.deactivateLeftValve();
      }
    });

    // PH
    this.arduinoService.getSensorObservable(Sensor.PH).subscribe((valorDelSensor) => {
      this.currentPh = valorDelSensor;

    });

    //SPEED - VELOCIDAD
    this.arduinoService.getSensorObservable(Sensor.SPEED).subscribe((valorDelSensor) => {
      // console.log("SENSOR DE VELOCIDAD",valorDelSensor);
      this.speed = valorDelSensor;
    });
  }

  //Función para abrir y cerrar electrovalvulas
  toggleValvulaDerecha():void{
    this.rightControlActive = !this.rightControlActive;
    if(this.rightControlActive){
      this.arduinoService.activateRightValve();
    }else{
      this.arduinoService.deactivateRightValve();
    }
  }

    //Activar y desactivar la válvulas izquierda
  toggleValvulaIzquierda():void{
    this.leftControlActive = !this.leftControlActive;
    if(this.leftControlActive){
      this.arduinoService.activateLeftValve();
    }else{
      this.arduinoService.deactivateLeftValve();
    }
  }
  // toggleValvulaDerecha($event : any):void{
  //   this.arduinoService.toggleValvulaDerecha();
  // }

  // toggleValvulaIzquierda($event : any):void{
  //   this.arduinoService.toggleValvulaIzquierda();
  // }

  // changeLeftControl($event : any){
  //   let command : SocketData = {
  //     event: SocketEvent.COMMANDS,
  //     type : 0,
  //     data : {
  //       device : Sensor.VALVE_LEFT,
  //       command : `${Number($event)}`
  //     }
  //   };
  // }

  // changeRightControl($event : any){
  //   let command : SocketData = {
  //     event: SocketEvent.COMMANDS,
  //     type : 0,
  //     data : {
  //       device : Sensor.VALVE_RIGHT,
  //       command : `${Number($event)}`
  //     }
  //   };
  // }

  // regulatePressure(){
  //   this.arduinoService.regulatePressureWithBars(+this.info);
  // }

}
