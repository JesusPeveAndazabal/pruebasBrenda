import { environment } from './../../../../environments/environment.prod';

import { Injectable } from '@angular/core';
import { ElectronService } from '../electron/electron.service';
import { Person,Lot, NozzleColor, NozzleType, Nozzles, WorkExecution, Work, Cultivation, Farm, Product, WaterVolumes, WorkExecutionConfiguration } from '../../models/models';
import * as moment from 'moment';
import { SocketEvent,WorkDataChange } from '../../utils/global';
import { LocalConf } from '../../models/local_conf';
import { Login } from '../../models/login';

@Injectable({
  providedIn: 'root'
})

export class DatabaseService extends ElectronService {
  // isService = false;
  // native = false;
  file : string;
  platform!: string;
  //#region plugin initialization functions

  constructor() {
    super();
    if(this.isElectron){
      this.file = this.path.resolve("bd/", "database.sqlite");
      //this.file = "C:/Users/BETA/Documents/proyectos/ScaleApp/src/assets/database.sqlite"
    }
  }

  /**
   * Return status of the initialization process
   * @returns successful initialization
   */
  // initializePlugin(): Promise<boolean> {

  // }

  /**
   * Returns the SQLite Plugin
   * @returns CapacitorSQLitePlugin
   */
  // getSqlitePlugin(): CapacitorSQLitePlugin {
  //   return this.sqlitePlugin;
  // }

  /**
   * Returns the SQLite connection
   * @returns SQLiteConnection
   */

  public openConnection(){
    let instance = this;

    return new Promise(function (resolve,reject) {
      let exists = instance.fs.existsSync(instance.file);
      if (exists) {
        let db = new instance.sqlite.Database(instance.file);
        return process.nextTick(() => resolve(db));
      } else {
          console.log("Creating DB file...");
          instance.fs.openSync(instance.file, "w");
          let db = new instance.sqlite.Database(instance.file);
          db.run('PRAGMA foreign_keys = ON;');
          //Creating schema
          let sql = "CREATE TABLE IF NOT EXISTS person (\n"
                + "	id integer PRIMARY KEY NOT NULL,\n"
                + "	code TEXT NOT NULL,\n"
                + "	fullname TEXT,\n"
                + "	document TEXT,\n"
                + "	type integer,\n"
                + "	is_deleted integer\n"
                + "	);\n"

                + "	CREATE INDEX IF NOT EXISTS person_index_code ON person (code);\n"

                + "	CREATE INDEX IF NOT EXISTS person_index_document ON person (document);\n"

                + "	CREATE TABLE IF NOT EXISTS work(\n"
                + "	id INTEGER PRIMARY KEY,\n"
                + "	name TEXT, \n"
                + "	cultivation INTEGER, \n"
                + "	cultivation_name TEXT, \n"
                + "	product INTEGER, \n"
                + "	product_name TEXT, \n"
                + "	risk INTEGER, \n"
                + "	risk_name TEXT, \n"
                + "	pressure_tolerance REAL \n"
                + "	); \n"

                + "	CREATE TABLE IF NOT EXISTS work_execution( \n"
                + "	id INTEGER PRIMARY KEY AUTOINCREMENT, \n"
                + "	work INTEGER, \n"
                + "	lot INTEGER, \n"
                + "	date TEXT, \n"
                + "	worker INTEGER, \n"
                + "	supervisor INTEGER, \n"
                + "	configuration TEXT, \n"
                + "	working_time TEXT, \n"
                + "	downtime TEXT, \n"
                + "	hectare REAL, \n"
                + "	cultivation INTEGER, \n"
                + "	product INTEGER, \n"
                + "	is_finished INTEGER, \n"
                + "	sended INTEGER \n"
                + "	); \n"

                + "	CREATE TABLE IF NOT EXISTS water_volumes( \n"
                + "	id INTEGER PRIMARY KEY AUTOINCREMENT, \n"
                + "	work_exec_id INTEGER, \n"
                + "	volume REAL \n"
                + "	); \n"

                + "	CREATE TABLE IF NOT EXISTS lot( \n"
                + "	id INTEGER PRIMARY KEY, \n"
                + "	name TEXT, \n"
                + "	hectare REAL, \n"
                + "	width REAL, \n"
                + "	volume REAL, \n"
                + "	cultivation INTEGER, \n"
                + "	cultivation_name TEXT, \n"
                + "	owner INTEGER, \n"
                + "	farm INTEGER, \n"
                + "	farm_name TEXT \n"
                + "	); \n"

                + "	CREATE TABLE IF NOT EXISTS nozzle_type ( \n"
                + "	id INTEGER PRIMARY KEY, \n"
                + "	name TEXT \n"
                + "	); \n"

                + "	CREATE TABLE IF NOT EXISTS nozzle_color( \n"
                + "	id INTEGER PRIMARY KEY, \n"
                + "	code TEXT, \n"
                + "	name TEXT \n"
                + "	); \n"

                + "	CREATE TABLE IF NOT EXISTS nozzles( \n"
                + "	id INTEGER PRIMARY KEY, \n"
                + "	type INTEGER, \n"
                + "	color INTEGER, \n"
                + "	pressure REAL, \n"
                + "	pressure_unit INTEGER, \n"
                + "	flow REAL \n"
                + "	); \n"

                + "	CREATE TABLE IF NOT EXISTS cultivation( \n"
                + "	id INTEGER PRIMARY KEY, \n"
                + "	code TEXT, \n"
                + "	name TEXT \n"
                + "	); \n"

                + "	CREATE TABLE IF NOT EXISTS farm( \n"
                + "	id INTEGER PRIMARY KEY, \n"
                + "	name TEXT \n"
                + "	); \n"

                + "	CREATE TABLE IF NOT EXISTS product( \n"
                + "	id INTEGER PRIMARY KEY, \n"
                + "	name TEXT \n"
                + "	); \n"

                + "	CREATE TABLE IF NOT EXISTS login( \n"
                + "	operador INTEGER, \n"
                + "	supervisor INTEGER, \n"
                + "	fechahora TEXT, \n"
                + " FOREIGN KEY (operador) REFERENCES person(id), \n"
                + " FOREIGN KEY (supervisor) REFERENCES person(id) \n"
                + "	); \n"

                + "	CREATE TABLE IF NOT EXISTS local_conf( \n"
                + "	api_server TEXT, \n"
                + "	vol_alert_on REAL, \n"
                + "	min_wflow REAL, \n"
                + "	max_wflow REAL, \n"
                + "	unit_pressure INTEGER, \n"
                + "	min_pressure REAL, \n"
                + "	max_pressure REAL \n"
                + " ); ";

          db = db.exec(sql);
          db.close();
          return process.nextTick(() => resolve(db));
      }
    });
  }

  async closeDB(): Promise<void> {
    let instance = this;
    let db = new instance.sqlite.Database(instance.file);
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error al cerrar la base de datos', err.message);
        } else {
          console.log('Base de datos SQLite cerrada');
        }
      });
    }
  }
  /**
   * Open a new database connection.
   * This method must be called inside the ngAfterViewInit method or after the next cycle methods of the component.
   * @param dbName Database name
   * @param encrypted work with encryption
   * @param mode `no-encryption`
   * @param version number of database version
   * @param isDelete delete the previous session's database
   * @param readOnly read only session
   * @returns SQLiteDBConnection instance
   */

  /**
   * Delete the current database
   * @returns void
   */

  /**
   * Close the database connection
   * @param dbName Database name
   * @param readOnly if the database was open as read only
   * @returns
   */

  async getTableNames(): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "SELECT * FROM sqlite_master";
      db.get(sql,[ ],(err,rows : any[])=>{
        if(err){
          process.nextTick(() => reject(err));
        }
        process.nextTick(() => resolve(rows));
      });
      db.close();
    });
  }

  /**
   * Get the Person's data from the database
   * @returns Array of Person class
   */
  async getPersonData(): Promise<Person[]> {
    return new Promise<Person[]>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "SELECT * from person where is_deleted = false";
      db.all(sql,[ ],(err,rows : Person[])=>{
        if(err){
          process.nextTick(() => reject(err));
        }
        process.nextTick(() => resolve(rows));
      });
      db.close();
    });
  }

  /**
   * Save Person data from server to local db for offline case uses
   * @param data Array of Person class
   * @returns void
   */

  async syncPersonData(data: Array<Person>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "INSERT INTO person (id, code, fullname, document, type, is_deleted) VALUES (?, ?, ?, ?, ?, ?);";

      // Iterar sobre los datos y realizar la inserción por cada uno
      data.forEach((o) => {
        db.run(sql, [o.id, o.code, o.fullname, o.document, o.type, o.is_deleted], (err: Error | null) => {
          if (err && err.message.includes('UNIQUE constraint failed')) {
            console.warn(`Registro duplicado para el id: ${o.id}. Ignorando.`);
          } else if (err) {
            console.error("SQLITE INSERT error", err);
            reject(err);
          }
        });
      });

      // Cerrar la base de datos después de que todas las inserciones se hayan completado
      db.close((err: Error | null) => {
        if (err) {
          console.error("Error al cerrar la base de datos", err);
          reject(err);
        } else {
          console.log("Base de datos cerrada");
          resolve(true);
        }
      });
    });
  }

  /**
   * Get the Lot's data from the database
   * @returns Array of Person class
   */
  async getLotData(): Promise<Lot[]> {
    return new Promise<Lot[]>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "SELECT * from lot";
      db.all(sql,[ ],(err,rows : Lot[])=>{
        if(err){
          process.nextTick(() => reject(err));
        }
        process.nextTick(() => resolve(rows));
      });
      db.close();
    });
  }

  /**
   * Save Lot data from server to local db for offline case uses
   * @param data Array of Lot class
   * @returns void
   */

  async syncLotsData(data: Array<Lot>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "INSERT INTO lot (id, name, hectare, width, volume, cultivation, cultivation_name, owner, farm, farm_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";

      // Iterar sobre los datos y realizar la inserción por cada uno
      data.forEach((o) => {
        db.run(sql, [o.id, o.name, o.hectare, o.width, o.volume, o.cultivation, o.cultivation_name, o.owner, o.farm, o.farm_name], (err: Error | null) => {
          if (err && err.message.includes('UNIQUE constraint failed')) {
            console.warn(`Registro duplicado para el id: ${o.id}. Ignorando.`);
          } else if (err) {
            console.error("SQLITE INSERT error", err);
            reject(err);
          }
        });
      });

      // Cerrar la base de datos después de que todas las inserciones se hayan completado
      db.close((err: Error | null) => {
        if (err) {
          console.error("Error al cerrar la base de datos", err);
          reject(err);
        } else {
          console.log("Base de datos cerrada");
          resolve(true);
        }
      });
    });
  }

  /**
   * Get the Nozzle's color data from the database
   * @returns Array of NozzleColor class
   */
  async getNozzleColorData(): Promise<NozzleColor[]> {
    return new Promise<NozzleColor[]>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "SELECT * from nozzle_color";
      db.all(sql,[ ],(err,rows : NozzleColor[])=>{
        if(err){
          process.nextTick(() => reject(err));
        }
        process.nextTick(() => resolve(rows));
      });
      db.close();
    });
  }

  /**
   * Save Nozzle's color data from server to local db for offline case uses
   * @param data Array of NozzleColor class
   * @returns void
   */

  async syncNozzleColorData(data: Array<NozzleColor>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "INSERT INTO nozzle_color (id, name, code) VALUES (?, ?, ?);";

      // Iterar sobre los datos y realizar la inserción por cada uno
      data.forEach((o) => {
        db.run(sql, [o.id, o.name, o.code], (err: Error | null) => {
          if (err && err.message.includes('UNIQUE constraint failed')) {
            console.warn(`Registro duplicado para el id: ${o.id}. Ignorando.`);
          } else if (err) {
            console.error("SQLITE INSERT error", err);
            reject(err);
          }
        });
      });

      // Cerrar la base de datos después de que todas las inserciones se hayan completado
      db.close((err: Error | null) => {
        if (err) {
          console.error("Error al cerrar la base de datos", err);
          reject(err);
        } else {
          console.log("Base de datos cerrada");
          resolve(true);
        }
      });
    });
  }

  /**
   * Get the Nozzle's type data from the database
   * @returns Array of NozzleType class
   */
  async getNozzleTypeData(): Promise<NozzleType[]> {
    return new Promise<NozzleType[]>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "SELECT * from nozzle_type";
      db.all(sql,[ ],(err,rows : NozzleType[])=>{
        if(err){
          process.nextTick(() => reject(err));
        }
        process.nextTick(() => resolve(rows));
      });
      db.close();
    });
  }

  /**
   * Save NozzleType data from server to local db for offline case uses
   * @param data Array of NozzleType class
   * @returns void
   */

  async syncNozzleTypeData(data: Array<NozzleType>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "INSERT INTO nozzle_type (id, name) VALUES (?, ?);";

      // Iterar sobre los datos y realizar la inserción por cada uno
      data.forEach((o) => {
        db.run(sql, [o.id, o.name], (err: Error | null) => {
          if (err && err.message.includes('UNIQUE constraint failed')) {
            console.warn(`Registro duplicado para el id: ${o.id}. Ignorando.`);
          } else if (err) {
            console.error("SQLITE INSERT error", err);
            reject(err);
          }
        });
      });

      // Cerrar la base de datos después de que todas las inserciones se hayan completado
      db.close((err: Error | null) => {
        if (err) {
          console.error("Error al cerrar la base de datos", err);
          reject(err);
        } else {
          console.log("Base de datos cerrada");
          resolve(true);
        }
      });
    });
  }

  /**
   * Get the Nozzle's data from the database
   * @returns Array of Nozzle class
   */
  async getNozzlesData(): Promise<Nozzles[]> {
    return new Promise<Nozzles[]>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "SELECT * from nozzles";
      db.all(sql,[ ],(err,rows : Nozzles[])=>{
        if(err){
          process.nextTick(() => reject(err));
        }
        process.nextTick(() => resolve(rows));
      });
      db.close();
    });
  }

  /**
   * Save Nozzle's data from server to local db for offline case uses
   * @param data Array of Nozzle class
   * @returns void
   */

  async syncNozzlesData(data: Array<Nozzles>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "INSERT INTO nozzles (id, type, color, pressure, pressure_unit, flow) VALUES (?, ?, ?, ?, ?, ?);";

      // Iterar sobre los datos y realizar la inserción por cada uno
      data.forEach((o) => {
        db.run(sql, [o.id, o.type, o.color, o.pressure, o.pressure_unit, o.flow], (err: Error | null) => {
          if (err && err.message.includes('UNIQUE constraint failed')) {
            console.warn(`Registro duplicado para el id: ${o.id}. Ignorando.`);
          } else if (err) {
            console.error("SQLITE INSERT error", err);
            reject(err);
          }
        });
      });

      // Cerrar la base de datos después de que todas las inserciones se hayan completado
      db.close((err: Error | null) => {
        if (err) {
          console.error("Error al cerrar la base de datos", err);
          reject(err);
        } else {
          console.log("Base de datos cerrada");
          resolve(true);
        }
      });
    });
  }

  /**
   * Get the WorkExecution's data from the database
   * @returns Array of WorkExecution class
   */

  async getWorkExecution(): Promise<WorkExecution[]> {
    return new Promise<WorkExecution[]>((resolve, reject) =>{
      let db = new this.sqlite.Database(this.file);
      let sql = "SELECT * from work_execution";
      db.all(sql,[ ],(err,rows : WorkExecution[])=>{
        if(err){
          process.nextTick(() => reject(err));
        }
        process.nextTick(() => resolve(rows));
      });
      db.close();
    });
  }

  /**
   * Get the WorkExecution's data from the database
   * @returns Array of WorkExecution class
   */
  async getLastWorkExecution(): Promise<WorkExecution> {
    return new Promise<WorkExecution>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "SELECT * from work_execution WHERE is_finished = 0 ORDER BY id DESC LIMIT 1";
      db.get(sql,[ ],(err,rows : WorkExecution)=>{
        if(err){
          process.nextTick(() => reject(err));
        }
        process.nextTick(() => resolve(rows));
      });
      db.close();
    });
  }

  /**
   * Get the WorkExecution's data from the database
   * @returns Array of WorkExecution class
   */
  async getLastWaterVolume(work : number): Promise<WaterVolumes> {
    return new Promise<WaterVolumes>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "SELECT * from water_volumes WHERE work_exec_id = ${work} ORDER BY id DESC LIMIT 1";
      db.get(sql,[work],(err,rows : WaterVolumes)=>{
        if(err){
          process.nextTick(() => reject(err));
        }
        process.nextTick(() => resolve(rows));
      });
      db.close();
    });
  }

  /**
   * Save WorkExecution's data from server to local db for offline case uses
   * @param data Array of WorkExecution class
   * @returns void
   */
  // async saveWorkExecutionData(o : WorkExecution): Promise<boolean> {
  //   return new Promise((resolve, reject) => {
  //     let db = new this.sqlite.Database(this.file);
  //     let sql = "INSERT INTO work_execution (work,lot,worker,supervisor,date,configuration,working_time,downtime,hectare,cultivation,product,is_finished,sended) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);";
  //     db = db.run(sql,[o.work,o.lot,o.worker,o.supervisor,o.date.format('YYYY-MM-DD H:mm:ss'),o.configuration,o.working_time.format('H:mm:ss'),o.downtime.format('H:mm:ss'),o.hectare,o.cultivation,o.product,o.is_finished,0],
  //       (err : Error)=>{
  //         if(err){
  //           console.log("SQLITE INSERT error", err);
  //           process.nextTick(() => reject(err));
  //         }
  //         process.nextTick(() => resolve(true));
  //       });
  //       db.close();
  //   });
  // }
  async saveWorkExecutionData(o: WorkExecution): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let insertSql =
        "INSERT INTO work_execution (work,lot,worker,supervisor,date,configuration,working_time,downtime,hectare,cultivation,product,is_finished,sended) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);";

      // Ejecutar la inserción en la tabla 'work_execution'
      db.run(
        insertSql,
        [
          o.work,
          o.lot,
          o.worker,
          o.supervisor,
          o.date.format("YYYY-MM-DD H:mm:ss"),
          o.configuration,
          o.working_time.format("H:mm:ss"),
          o.downtime.format("H:mm:ss"),
          o.hectare,
          o.cultivation,
          o.product,
          o.is_finished,
          0,
        ],
        (err: Error | null) => {
          if (err) {
            console.error("SQLITE INSERT error", err);
            reject(err);
          } else {
            console.log("Inserción exitosa");
            resolve(true);
          }

          // Cerrar la base de datos después de la operación
          db.close((closeErr: Error | null) => {
            if (closeErr) {
              console.error("Error al cerrar la base de datos", closeErr);
            }
          });
        }
      );
    });
  }

  /**
   * Save WorkExecution's data from server to local db for offline case uses
   * @param data Array of WorkExecution class
   * @returns void
   */
  // async saveWaterVolumes(o : WaterVolumes,work : WorkExecution): Promise<boolean> {
  //   return new Promise<boolean>((resolve, reject) =>{
  //     let db = new this.sqlite.Database(this.file);
  //     let sql = "INSERT INTO water_volumes (work_exec_id,volume) VALUES (?,?);";
  //     db = db.run(sql,[o.work_exec_id,o.volume],
  //       (err : Error)=>{
  //         if(err){
  //           console.log("SQLITE INSERT error", err);
  //           process.nextTick(() => reject(err));
  //         }
  //         process.nextTick(() => resolve(true));
  //       });
  //       db.close();
  //     sql = "UPDATE work_execution SET configuration = ? where id = ?;";
  //     db = db.run(sql,[work.configuration,o.work_exec_id],
  //       (err : Error)=>{
  //         if(err){
  //           console.log("SQLITE INSERT error", err);
  //           process.nextTick(() => reject(err));
  //         }
  //         process.nextTick(() => resolve(true));
  //       });
  //       db.close();
  //   });
  // }
  async saveWaterVolumes(o: WaterVolumes, work: WorkExecution): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let insertSql = "INSERT INTO water_volumes (work_exec_id, volume) VALUES (?, ?);";
      let updateSql = "UPDATE work_execution SET configuration = ? WHERE id = ?;";

      // Ejecutar la inserción en la tabla 'water_volumes'
      db.run(insertSql, [o.work_exec_id, o.volume], (insertErr: Error | null) => {
        if (insertErr) {
          console.error("SQLITE INSERT error", insertErr);
          reject(insertErr);
          return;
        }

        // Ejecutar la actualización en la tabla 'work_execution'
        db.run(updateSql, [work.configuration, o.work_exec_id], (updateErr: Error | null) => {
          if (updateErr) {
            console.error("SQLITE UPDATE error", updateErr);
            reject(updateErr);
          } else {
            console.log("Inserción y actualización exitosas");
            resolve(true);
          }

          // Cerrar la base de datos después de todas las operaciones
          db.close((closeErr: Error | null) => {
            if (closeErr) {
              console.error("Error al cerrar la base de datos", closeErr);
            }
          });
        });
      });
    });
  }


  /**
   * Save WorkExecution's data from server to local db for offline case uses
   * @param data Array of WorkExecution class
   * @returns void
   */
  // async updateWorkExecutionData(o : WorkExecution): Promise<boolean> {
  //   return new Promise((resolve, reject) => {
  //     // o.supervisor = !o.supervisor ? null!: o.supervisor;
  //     let db = new this.sqlite.Database(this.file);
  //     let sql = "UPDATE work_execution SET work = ?, supervisor = ?, lot = ?,worker = ?,configuration = ?, hectare = ?,cultivation = ?, product = ? WHERE id = ?;";
  //     db = db.run(sql,[o.work,o.supervisor, o.lot,o.worker,o.configuration,o.hectare,o.cultivation,o.product,o.id],
  //       (err : Error)=>{
  //         if(err){
  //           console.log("SQLITE INSERT error", err);
  //           process.nextTick(() => reject(err));
  //         }
  //         process.nextTick(() => resolve(true));
  //       });
  //       db.close();
  //   });
  // }

  async updateWorkExecutionData(o: WorkExecution): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql =
        "UPDATE work_execution SET work = ?, supervisor = ?, lot = ?, worker = ?, configuration = ?, hectare = ?, cultivation = ?, product = ? WHERE id = ?;";

      // Ejecutar la actualización en la tabla 'work_execution'
      db.run(sql, [o.work, o.supervisor, o.lot, o.worker, o.configuration, o.hectare, o.cultivation, o.product, o.id], (err: Error | null) => {
        if (err) {
          console.error("SQLITE UPDATE error", err);
          reject(err);
        } else {
          console.log("Actualización exitosa");
          resolve(true);
        }

        // Cerrar la base de datos después de la operación
        db.close((closeErr: Error | null) => {
          if (closeErr) {
            console.error("Error al cerrar la base de datos", closeErr);
          }
        });
      });
    });
  }

  /**
   * Save WorkExecution's data from server to local db for offline case uses
   * @param data Array of WorkExecution class
   * @returns void
   */
  // async confirmWorkExecSavedOnServer(o : WorkExecution): Promise<boolean> {
  //   return new Promise((resolve, reject) => {
  //     let db = new this.sqlite.Database(this.file);
  //     let sql = "UPDATE work_execution SET sended = ? WHERE id = ?;";
  //     db = db.run(sql,[o.sended,o.id],
  //       (err : Error)=>{
  //         if(err){
  //           console.log("SQLITE INSERT error", err);
  //           process.nextTick(() => reject(err));
  //         }
  //         process.nextTick(() => resolve(true));
  //       });
  //       db.close();
  //   });
  // }
  async confirmWorkExecSavedOnServer(o: WorkExecution): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "UPDATE work_execution SET sended = ? WHERE id = ?;";

      // Ejecutar la actualización en la tabla 'work_execution'
      db.run(sql, [o.sended, o.id], (err: Error | null) => {
        if (err) {
          console.error("SQLITE UPDATE error", err);
          reject(err);
        } else {
          console.log("Actualización exitosa");
          resolve(true);
        }

        // Cerrar la base de datos después de la operación
        db.close((closeErr: Error | null) => {
          if (closeErr) {
            console.error("Error al cerrar la base de datos", closeErr);
          }
        });
      });
    });
  }

  /**
   * Save WorkExecution's data from server to local db for offline case uses
   * @param data Array of WorkExecution class
   * @returns void
   */
  // async finishWorkExecution(o : WorkExecution): Promise<boolean> {
  //   return new Promise((resolve, reject) => {
  //     let db = new this.sqlite.Database(this.file);
  //     let sql = "UPDATE work_execution SET is_finished = 1 WHERE id = ?;";
  //     db = db.run(sql,[o.id],
  //       (err : Error)=>{
  //         if(err){
  //           console.log("SQLITE INSERT error", err);
  //           process.nextTick(() => reject(err));
  //         }
  //         process.nextTick(() => resolve(true));
  //       });
  //       db.close();
  //   });
  // }

  async finishWorkExecution(o: WorkExecution): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "UPDATE work_execution SET is_finished = 1 WHERE id = ?;";

      // Ejecutar la actualización en la tabla 'work_execution'
      db.run(sql, [o.id], (err: Error | null) => {
        if (err) {
          console.error("SQLITE UPDATE error", err);
          reject(err);
        } else {
          console.log("Actualización exitosa");
          resolve(true);
        }

        // Cerrar la base de datos después de la operación
        db.close((closeErr: Error | null) => {
          if (closeErr) {
            console.error("Error al cerrar la base de datos", closeErr);
          }
        });
      });
    });
  }


  /**
   * Get the Work's data from the database
   * @returns Array of Work class
   */
  async getWorkData(): Promise<Work[]> {
    return new Promise<Work[]>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "SELECT * from work";
      db.all(sql,[ ],(err,rows : Work[])=>{
        if(err){
          process.nextTick(() => reject(err));
        }
        process.nextTick(() => resolve(rows));
      });
      db.close();
    });
  }

  /**
   * Save Work's data from server to local db for offline case uses
   * @param data Array of Work class
   * @returns void
   */

  async syncWorkData(data: Array<Work>): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql =
        "INSERT INTO work (id, name, cultivation, cultivation_name, product, product_name, risk, risk_name, pressure_tolerance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);";

      // Iterar sobre los datos y realizar la inserción por cada uno
      data.forEach((o) => {
        db.run(sql, [o.id, o.name, o.cultivation, o.cultivation_name, o.product, o.product_name, o.risk, o.risk_name, o.pressure_tolerance], (err: Error | null) => {
          if (err && err.message.includes('UNIQUE constraint failed')) {
            console.warn(`Registro duplicado para el id: ${o.id}. Ignorando.`);
          } else if (err) {
            console.error("SQLITE INSERT error", err);
            reject(err);
          }
        });
      });

      // Cerrar la base de datos después de que todas las inserciones se hayan completado
      db.close((err: Error | null) => {
        if (err) {
          console.error("Error al cerrar la base de datos", err);
          reject(err);
        } else {
          console.log("Base de datos cerrada");
          resolve(true);
        }
      });
    });
  }

  /**
   * Get the Cultivation's data from the database
   * @returns Array of Cultivation class
   */
  async getCultivationData(): Promise<Cultivation[]> {
    return new Promise<Cultivation[]>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "SELECT * from cultivation";
      db.all(sql,[ ],(err,rows : Cultivation[])=>{
        if(err){
          process.nextTick(() => reject(err));
        }
        process.nextTick(() => resolve(rows));
      });
      db.close();
    });
  }

  /**
   * Save Cultivation's data from server to local db for offline case uses
   * @param data Array of Cultivation class
   * @returns void
   */

  async syncCultivationData(data: Array<Cultivation>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "INSERT INTO cultivation (id, code, name) VALUES (?, ?, ?);";

      // Iterar sobre los datos y realizar la inserción por cada uno
      data.forEach((o) => {
        db.run(sql, [o.id, o.code, o.name], (err: Error | null) => {
          if (err) {
            console.error("SQLITE INSERT error", err);
            reject(err);
          }
        });
      });

      // Cerrar la base de datos después de que todas las inserciones se hayan completado
      db.close((err: Error | null) => {
        if (err) {
          console.error("Error al cerrar la base de datos", err);
          reject(err);
        } else {
          console.log("Base de datos cerrada");
          resolve(true);
        }
      });
    });
  }

  /**
   * Get the Farm's data from the database
   * @returns Array of Farm class
   */
  async getFarmData(): Promise<Farm[]> {
    return new Promise<Farm[]>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "SELECT * from farm";
      db.all(sql,[ ],(err,rows : Farm[])=>{
        if(err){
          process.nextTick(() => reject(err));
        }
        process.nextTick(() => resolve(rows));
      });
      db.close();
    });
  }

  /**
   * Save Farm's data from server to local db for offline case uses
   * @param data Array of Farm class
   * @returns void
   */

  async syncFarmData(data: Array<Farm>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "INSERT INTO farm (id, name) VALUES (?, ?);";

      // Iterar sobre los datos y realizar la inserción por cada uno
      data.forEach((o) => {
        db.run(sql, [o.id, o.name], (err: Error | null) => {
          if (err) {
            console.error("SQLITE INSERT error", err);
            reject(err);
          }
        });
      });

      // Cerrar la base de datos después de que todas las inserciones se hayan completado
      db.close((err: Error | null) => {
        if (err) {
          console.error("Error al cerrar la base de datos", err);
          reject(err);
        } else {
          console.log("Base de datos cerrada");
          resolve(true);
        }
      });
    });
  }


  /**
   * Get the Farm's data from the database
   * @returns Array of Farm class
   */
  async getProductData(): Promise<Product[]> {
    return new Promise<Product[]>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "SELECT * from product";
      db.all(sql,[ ],(err,rows : Product[])=>{
        if(err){
          process.nextTick(() => reject(err));
        }
        process.nextTick(() => resolve(rows));
      });
      db.close();
    });
  }

  /**
   * Save Farm's data from server to local db for offline case uses
   * @param data Array of Farm class
   * @returns void
   */

  async syncProductData(data: Array<Product>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "INSERT INTO product (id, name) VALUES (?, ?);";

      // Iterar sobre los datos y realizar la inserción por cada uno
      data.forEach((o) => {
        db.run(sql, [o.id, o.name], (err: Error | null) => {
          if (err && err.message.includes('UNIQUE constraint failed')) {
            console.warn(`Registro duplicado para el id: ${o.id}. Ignorando.`);
          } else if (err) {
            console.error("SQLITE INSERT error", err);
            reject(err);
          }
        });
      });

      // Cerrar la base de datos después de que todas las inserciones se hayan completado
      db.close((err: Error | null) => {
        if (err) {
          console.error("Error al cerrar la base de datos", err);
          reject(err);
        } else {
          console.log("Base de datos cerrada");
          resolve(true);
        }
      });
    });
  }

  /**
   * Get the LocalConfig's data from the database
   * @returns Array of WorkExecution class
   */

  async getLocalConfig(): Promise<LocalConf> {
    return new Promise<LocalConf>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "SELECT * from local_conf LIMIT 1;";
      db.get(sql,[],(err,rows : LocalConf)=>{
        if(err){
          process.nextTick(() => reject(err));
        }
        process.nextTick(() => resolve(rows));
      });
      db.close();
    });
  }

  /**
   * Save LocalConfig's data from server to local db for offline case uses
   * @param data LocalConfig instance
   * @returns void
   */

  async saveLocalConfig(o : LocalConf): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "INSERT INTO local_conf (api_server,vol_alert_on,min_wflow,max_wflow,unit_pressure,min_pressure,max_pressure) VALUES (?,?,?,?,?,?,?);";
      db = db.run(sql,[o.api_server,o.vol_alert_on,o.min_wflow,o.max_wflow,o.unit_pressure,o.min_pressure,o.max_pressure],
        (err : Error)=>{
          if(err){
            console.log("SQLITE INSERT error", err);
            process.nextTick(() => reject(err));
          }
          process.nextTick(() => resolve(true));
        });
        db.close();
    });
  }

  async getRecordById(table: string, id: number): Promise<any | null> {
    return new Promise((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = `SELECT * FROM ${table} WHERE id = ?;`;

      db.get(sql, [id], (err: Error | null, row: any) => {
        if (err) {
          console.error("SQLITE SELECT error", err);
          reject(err);
        } else {
          resolve(row);
        }
      });

      db.close();
    });
  }

  async saveLogin(operador: number, supervisor: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "INSERT INTO login (operador,supervisor, fechahora) VALUES (?,?,?);";
      db = db.run(sql,[operador,supervisor, moment.now()],
        (err : Error)=>{
          if(err){
            console.log("SQLITE INSERT error", err);
            process.nextTick(() => reject(err));
          }
          process.nextTick(() => resolve(true));
        });
        db.close();
    });
  }

  async getLogin(): Promise<Login> {
    return new Promise<Login>((resolve, reject) => {
      let db = new this.sqlite.Database(this.file);
      let sql = "SELECT operador,p1.id as 'id_op', p1.code as 'code_op', p1.fullname as 'fullname_op', p1.document as 'document_op', p1.type as 'type_op', p1.is_deleted as 'isdeleted_op', supervisor, person.id as 'id_sup', person.code as 'code_sup', person.fullname as 'fullname_sup', person.document as 'document_sup', person.type as 'type_sup', person.is_deleted as 'isdeleted_sup', fechahora FROM login INNER JOIN person p1 ON login.operador = p1.id INNER JOIN person ON login.supervisor=person.id ORDER BY fechahora DESC LIMIT 1 ;";
      db.get(sql,[],(err,rows : Login)=>{
        if(err){
          process.nextTick(() => reject(err));
        }
        process.nextTick(() => resolve(rows));
      });
      db.close();
    });
  }

}
