import { WorkExecution } from './../../../core/models/work-execution';
import { Component, Input, OnInit,OnChanges, SimpleChanges,AfterViewInit } from '@angular/core';
import { WorkExecutionConfiguration } from './../../../core/models/we-configuration';
// import { WorkExecution } from 'src/app/core/models/work-execution';
import { UnitPressure, convertPressureUnit,UnitPressureEnum } from './../../../core/utils/global';

@Component({
  selector: 'app-pressure',
  templateUrl: './pressure.component.html',
  styleUrls: ['./pressure.component.scss'],
})
export class PressureComponent  implements OnChanges,AfterViewInit {
  @Input("wExecution") wExecution! : WorkExecution;
  // @Input() wExecution: any;
  @Input("real_pressure") real_pressure : number = 0;

  teoric_pressure: any = { value : 0.00, unit: "bar"};
  efficiency_pressure: any = { value : 0.00, unit: "%"};
  pressure: any = { value : 0, unit: "bar"};

  private wConfig : WorkExecutionConfiguration | undefined;

  constructor() { }

  ngAfterViewInit() {
    if(this.wExecution){
      this.wConfig = JSON.parse(this.wExecution.configuration);
      this.teoric_pressure = {
        value : convertPressureUnit(this.wConfig!.pressure,UnitPressureEnum.BAR,this.wConfig!.unit),
        unit : UnitPressure.find(p => p.value == this.wConfig!.unit)?.name
      };

      //this.efficiency_pressure.unit = UnitPressure.find(p => p.value == this.wConfig!.unit)?.name;
      this.teoric_pressure.value = parseFloat(parseFloat(this.teoric_pressure.value).toFixed(2));
      this.pressure.unit = UnitPressure.find(p => p.value == this.wConfig!.unit)?.name;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if(this.wExecution && changes['wExecution']){
      this.wConfig = JSON.parse(this.wExecution.configuration);
      this.teoric_pressure = {
        value : convertPressureUnit(this.wConfig!.pressure,UnitPressureEnum.BAR,this.wConfig!.unit),
        unit : UnitPressure.find(p => p.value == this.wConfig!.unit)?.name
      };

      this.teoric_pressure.value = parseFloat(parseFloat(this.teoric_pressure.value).toFixed(2));
      this.pressure.unit = UnitPressure.find(p => p.value == this.wConfig!.unit)?.name;
    }
    else if(changes['real_pressure']){
      if(this.wConfig){
        let newValue = convertPressureUnit(changes['real_pressure'].currentValue,UnitPressureEnum.BAR,this.wConfig!.unit);
        this.pressure.value = parseFloat(newValue.toFixed(2));


        let relativeError : number = Math.abs((this.teoric_pressure.value - this.pressure.value) / this.teoric_pressure.value * 100);

        this.efficiency_pressure.value = (100- relativeError).toFixed(2);
      }
    }
  }
}
