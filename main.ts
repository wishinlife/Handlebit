/*
 handlebit package
*/
 //% weight=10 icon="\uf013" color=#2896ff
namespace handlebit {
	
    export enum Colors {
        //% blockId="Red" block="Red"
        Red = 0x01,
        //% blockId="Green" block="Green"
        Green = 0x02,
        //% blockId="Blue" block="Blue"
		Blue = 0x03,
    }
        
    export enum HandleButton {
        //% block="Touch key"
        TOUCHKEY = EventBusValue.MES_DPAD_BUTTON_1_DOWN,
        //% block="B1"
        B1 = EventBusValue.MES_DPAD_BUTTON_2_DOWN,
        //% block="B2"
        B2 = EventBusValue.MES_DPAD_BUTTON_3_DOWN,
        //% block="B3"
        B3 = EventBusValue.MES_DPAD_BUTTON_4_DOWN,
        //% block="B4"
        B4 = EventBusValue.MES_DPAD_BUTTON_A_DOWN,
        //% block="Left joystick"
        JOYSTICK1 = EventBusValue.MES_DPAD_BUTTON_B_DOWN,
        //% block="Right joystick"
        JOYSTICK2 = EventBusValue.MES_DPAD_BUTTON_C_DOWN
    }


    export enum HandleSensorValue {
        //% block="Sound"
        SOUND,
        //% block="Light"
        LIGHT, 
        //% block="Power"
        POWER,
        //% block="Left joystick X"
        JOYSTICK_X1,
        //% block="Left joystick Y"
        JOYSTICK_Y1,
        //% block="Right joystick X"
        JOYSTICK_X2,
        //% block="Right joystick Y"
        JOYSTICK_Y2,
        //% block="Ultrasonic"
        ULTRASONIC,
        //% block="konb"
        KNOB
    }


    let lhRGBLight: HandleRGBLight.LHRGBLight;
	let R_F: number;
	let r_f: number;
	
	let g_f: number;
	let G_F: number;

	let b_f: number;
    let B_F: number;

    let Sound: number = -1;
    let Light: number = -1;
    let Power: number = -1;
    let JoystickX1: number = -1;
    let JoystickX2: number = -1;
    let JoystickY1: number = -1;
    let JoystickY2: number = -1;
    let UltrasonicValue: number = -1;
    let Knob: number = -1;
    let handleCmd: string = "";

/**
   * Handlebit board initialization, please execute at boot time
  */
  //% weight=100 blockId=handlebitInit block="Initialize Handlebit"
  export function handlebitInit() {
    initRGBLight();   
    initColorSensor();
  serial.redirect(
     SerialPin.P12,
     SerialPin.P8,
     BaudRate.BaudRate115200);
    control.waitMicros(50);
    let buf = pins.createBuffer(4);
    buf[0] = 0x55;
    buf[1] = 0x55;
    buf[2] = 0x02;
    buf[3] = 0x5A;//cmd type
    serial.writeBuffer(buf);
    basic.forever(() => {
      getHandleCmd();
      });
}

/**
* Set the angle of the servo, range from 0 to 180 degree
*/
//% weight=98 blockId=setServoPosition block="Set servo|angle %angle|duration %duration"
//% angle.min=0 angle.max=180
    export function setServoPosition(angle: number, duration: number) {
        if (angle > 180 || angle < 0)
        {
            return; 
        }    
        let position = mapRGB(angle, 0, 180, 500, 2500);
       
	   let buf = pins.createBuffer(10);
	   buf[0] = 0x55;
	   buf[1] = 0x55;
	   buf[2] = 0x08;
	   buf[3] = 0x03;//cmd type
	   buf[4] = 0x01;
	   buf[5] = duration & 0xff;
	   buf[6] = (duration >> 8) & 0xff;
	   buf[7] = 0x01;
	   buf[8] = position & 0xff;
	   buf[9] = (position >> 8) & 0xff;
	   serial.writeBuffer(buf);
}
    
/**
*	Set the speed of motor, range from -100 to 100.
*/
//% weight=97  blockId=setMotorSpeed block="Set motor speed|%speed"
//% speed.min=-100 speed.max=100
    export function setMotorSpeed(speed: number) {
        if (speed > 100 || speed < -100) {
        return;
        }
        speed = speed * -1;
    let buf = pins.createBuffer(5);
    buf[0] = 0x55;
    buf[1] = 0x55;
    buf[2] = 0x03;
    buf[3] = 0x32;//cmd type
    buf[4] = speed;
    serial.writeBuffer(buf);
}    
    /**
	 * Initialize RGB
	 */
	function initRGBLight() {
		if (!lhRGBLight) {
			lhRGBLight = HandleRGBLight.create(DigitalPin.P15, 1, HandleRGBPixelMode.RGB);
		}
    }
    
    /**
     * Set the color of the colored lights.
     */
    //% weight=96 blockId=setPixelRGB block="Set light color to %rgb"
    export function setPixelRGB(rgb: HandleRGBColors)
    {
        lhRGBLight.setPixelColor(0, rgb);
        lhRGBLight.show();
    }
    /**
     * Set RGB Color argument
     */
    //% weight=94 blockId=setPixelRGBArgs block="Set light color to %rgb,range from 1 to 9"
    //% rgb.min=1 rgb.max=9
    export function setPixelRGBArgs(rgb: number)
    {
        lhRGBLight.setPixelColor(0, rgb);
        lhRGBLight.show();
    }
   

    /**
     * Clear the color of the colored lights and turn off the lights.
     */
    //% weight=92 blockGap=50 blockId=clearLight block="Clear light"
    export function clearLight() {
        lhRGBLight.clear();
    }


	const APDS9960_I2C_ADDR = 0x39;
    const APDS9960_ID_1 = 0xA8;
    const APDS9960_ID_2 = 0x9C;
    /* APDS-9960 register addresses */
    const APDS9960_ENABLE = 0x80;
    const APDS9960_ATIME  = 0x81;
    const APDS9960_WTIME  = 0x83;
    const APDS9960_AILTL  = 0x84;
    const APDS9960_AILTH  = 0x85;
    const APDS9960_AIHTL  = 0x86;
    const APDS9960_AIHTH  = 0x87;
    const APDS9960_PILT = 0x89;
    const APDS9960_PIHT = 0x8B;
    const APDS9960_PERS = 0x8C;
    const APDS9960_CONFIG1 = 0x8D;
    const APDS9960_PPULSE  = 0x8E;
    const APDS9960_CONTROL = 0x8F;
    const APDS9960_CONFIG2 = 0x90;
    const APDS9960_ID = 0x92;
    const APDS9960_STATUS  = 0x93;
    const APDS9960_CDATAL  = 0x94;
    const APDS9960_CDATAH  = 0x95;
    const APDS9960_RDATAL  = 0x96;
    const APDS9960_RDATAH  = 0x97;
    const APDS9960_GDATAL  = 0x98;
    const APDS9960_GDATAH  = 0x99;
    const APDS9960_BDATAL  = 0x9A;
    const APDS9960_BDATAH  = 0x9B;
    const APDS9960_PDATA   = 0x9C;
    const APDS9960_POFFSET_UR = 0x9D;
    const APDS9960_POFFSET_DL = 0x9E;
    const APDS9960_CONFIG3 = 0x9F;


    /* LED Drive values */
    const LED_DRIVE_100MA = 0;
    const LED_DRIVE_50MA = 1;
    const LED_DRIVE_25MA = 2;
    const LED_DRIVE_12_5MA = 3;

    /* ALS Gain (AGAIN) values */
    const AGAIN_1X = 0;
    const AGAIN_4X = 1;
    const AGAIN_16X = 2;
    const AGAIN_64X = 3;
    
    /* Default values */
    const DEFAULT_ATIME = 219;    // 103ms
    const DEFAULT_WTIME = 246;    // 27ms
    const DEFAULT_PROX_PPULSE = 0x87;    // 16us, 8 pulses
    const DEFAULT_GESTURE_PPULSE = 0x89;    // 16us, 10 pulses
    const DEFAULT_POFFSET_UR = 0;       // 0 offset
    const DEFAULT_POFFSET_DL = 0;       // 0 offset      
    const DEFAULT_CONFIG1 = 0x60;    // No 12x wait (WTIME) factor
    const DEFAULT_PILT = 0;       // Low proximity threshold
    const DEFAULT_PIHT = 50;      // High proximity threshold
    const DEFAULT_AILT = 0xFFFF;  // Force interrupt for calibration
    const DEFAULT_AIHT = 0;
    const DEFAULT_PERS = 0x11;    // 2 consecutive prox or ALS for int.
    const DEFAULT_CONFIG2 = 0x01;    // No saturation interrupts or LED boost  
    const DEFAULT_CONFIG3 = 0;       // Enable all photodiodes, no SAI
    const DEFAULT_GPENTH = 40;      // Threshold for entering gesture mode
    const DEFAULT_GEXTH = 30;      // Threshold for exiting gesture mode    
    const DEFAULT_GCONF1 = 0x40;    // 4 gesture events for int., 1 for exit
    const DEFAULT_GOFFSET = 0;       // No offset scaling for gesture mode
    const DEFAULT_GPULSE = 0xC9;    // 32us, 10 pulses
    const DEFAULT_GCONF3 = 0;       // All photodiodes active during gesture
    const DEFAULT_GIEN = 0;       // Disable gesture interrupts
    const DEFAULT_LDRIVE = LED_DRIVE_100MA;
    const DEFAULT_AGAIN = AGAIN_4X;
    
    const OFF = 0;
    const ON = 1;
    const POWER = 0;
    const AMBIENT_LIGHT = 1;
    const PROXIMITY = 2;
    const WAIT = 3;
    const AMBIENT_LIGHT_INT = 4;
    const PROXIMITY_INT = 5;
    const GESTURE = 6;
    const ALL = 7;


    function i2cwrite(reg: number, value: number) {
       let buf = pins.createBuffer(2);
       buf[0] = reg;
       buf[1] = value;
       pins.i2cWriteBuffer(APDS9960_I2C_ADDR, buf);
    }

     function i2cread(reg: number): number {
		pins.i2cWriteNumber(APDS9960_I2C_ADDR, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(APDS9960_I2C_ADDR, NumberFormat.UInt8BE);
        return val;
    }

     function InitColor(): boolean {
         let id = i2cread(APDS9960_ID);
        //  serial.writeLine("id:")
        //  serial.writeNumber(id); 
        if (!(id == APDS9960_ID_1 || id == APDS9960_ID_2)) {
            return false;
         }
        //  serial.writeLine("set mode:")
        setMode(ALL, OFF);
        i2cwrite(APDS9960_ATIME, DEFAULT_ATIME);
        i2cwrite(APDS9960_WTIME, DEFAULT_WTIME);
        i2cwrite(APDS9960_PPULSE, DEFAULT_PROX_PPULSE);
        i2cwrite(APDS9960_POFFSET_UR, DEFAULT_POFFSET_UR);
        i2cwrite(APDS9960_POFFSET_DL, DEFAULT_POFFSET_DL);
         i2cwrite(APDS9960_CONFIG1, DEFAULT_CONFIG1);
        setLEDDrive(DEFAULT_LDRIVE);
        setAmbientLightGain(DEFAULT_AGAIN);
        setLightIntLowThreshold(DEFAULT_AILT);
        setLightIntHighThreshold(DEFAULT_AIHT);
        i2cwrite(APDS9960_PERS, DEFAULT_PERS);
        i2cwrite(APDS9960_CONFIG2, DEFAULT_CONFIG2);
        i2cwrite(APDS9960_CONFIG3, DEFAULT_CONFIG3);
        return true;  
    }
        
     function setMode(mode: number, enable: number) {
         let reg_val = getMode();
         serial.writeLine("mode:");
         serial.writeNumber(reg_val);
            /* Change bit(s) in ENABLE register */
        enable = enable & 0x01;
         if (mode >= 0 && mode <= 6)
         {
             if (enable > 0)
             {
                reg_val |= (1 << mode);
             }
             else
             {
                //reg_val &= ~(1 << mode);
                 reg_val &= (0xff-(1 << mode)); 
             }
        }
         else if(mode == ALL)
         {
             if (enable > 0)
             {
                reg_val = 0x7F;
             }
             else
             {
                reg_val = 0x00;
             }
        }
        i2cwrite(APDS9960_ENABLE,reg_val);
    }
    
     function getMode(): number {
            let enable_value = i2cread(APDS9960_ENABLE);
            return enable_value;
        }

     function setLEDDrive(drive: number) {
        let val = i2cread(APDS9960_CONTROL);
            /* Set bits in register to given value */
         drive &= 0b00000011;
         drive = drive << 6;
         val &= 0b00111111;
         val |= drive;
         i2cwrite(APDS9960_CONTROL,val);
    }
    
     function setLightIntLowThreshold(threshold: number) {
        let val_low = threshold & 0x00FF;
        let val_high = (threshold & 0xFF00) >> 8;
        i2cwrite(APDS9960_AILTL, val_low);
        i2cwrite(APDS9960_AILTH,val_high);
    }

     function setLightIntHighThreshold(threshold: number) {
        let val_low = threshold & 0x00FF;
        let val_high = (threshold & 0xFF00) >> 8;
        i2cwrite(APDS9960_AIHTL, val_low);
        i2cwrite(APDS9960_AIHTH, val_high);
    }

     function enableLightSensor(interrupts: boolean) {
        setAmbientLightGain(DEFAULT_AGAIN);
        if (interrupts)
        {
            setAmbientLightIntEnable(1);
        }   
        else
        {
            setAmbientLightIntEnable(0);
        }
        enablePower();
        setMode(AMBIENT_LIGHT,1);
    }

     function setAmbientLightGain(drive: number) {
        let val = i2cread(APDS9960_CONTROL);
            /* Set bits in register to given value */
        drive &= 0b00000011;
        val &= 0b11111100;
        val |= drive;
        i2cwrite(APDS9960_CONTROL,val);
    }

     function getAmbientLightGain(): number {
        let val = i2cread(APDS9960_CONTROL);
        val &= 0b00000011;
        return val;
    }

     function enablePower() {
        setMode(POWER,1);
    }

     function setAmbientLightIntEnable(enable: number) {
        let val = i2cread(APDS9960_ENABLE);
            /* Set bits in register to given value */
        enable &= 0b00000001;
        enable = enable << 4;
        val &= 0b11101111;
        val |= enable;
        i2cwrite(APDS9960_ENABLE, val);
    }

     function readAmbientLight(): number {
        let val_byte = i2cread(APDS9960_CDATAL);
        let val = val_byte;
        val_byte = i2cread(APDS9960_CDATAH);
        val = val + val_byte << 8;
        return val;
    }
    
     function readRedLight(): number {
     
        let val_byte = i2cread(APDS9960_RDATAL);
        let val = val_byte;
        val_byte = i2cread(APDS9960_RDATAH);
        val = val + val_byte << 8;
        return val;
    }

     function readGreenLight(): number {
        
           let val_byte = i2cread(APDS9960_GDATAL);
           let val = val_byte;
           val_byte = i2cread(APDS9960_GDATAH);
           val = val + val_byte << 8;
           return val;
    }
    
     function readBlueLight(): number {
        
           let val_byte = i2cread(APDS9960_BDATAL);
           let val = val_byte;
           val_byte = i2cread(APDS9960_BDATAH);
           val = val + val_byte << 8;
           return val;
       }

	/**
	 * Init Color Sensor
	 */
	export function initColorSensor() {
        InitColor();
		enableLightSensor(false);
		control.waitMicros(100);
	}

	/**
	 * Color sensor white calibration, each time you turn on the first use of the color sensor the white must be corrected at first.
	 */
	//% weight=90 blockId=adjustWhite block="Adjust white color"
	export function adjustWhite() {
		R_F = readRedLight();
		G_F = readGreenLight();
		B_F = readBlueLight();

    	//Measure twice, and then calculate their average.
    	R_F =  (readRedLight() + R_F) / 2;
   	 	G_F = (readGreenLight() + G_F) / 2;
    	B_F = (readBlueLight() + B_F) / 2 ;

	}


	/**
	 * Color sensor black calibration, each time you turn on the first use of the color sensor the white must be adjusted at first then adjust black.
	 */
	//% weight=88 blockId=adjustBlack block="Adjust black color"
	export function adjustBlack() {
		r_f = readRedLight();
		g_f = readGreenLight();
		b_f = readBlueLight();

		//Measure twice, and then calculate their average.
		r_f = (readRedLight() + r_f) / 2;
		g_f = (readGreenLight() + g_f) / 2;
		b_f = (readBlueLight() + b_f) / 2;
	}

	/**
	 *  Color sensor to obtain color value, white and black must be corrected before execution.
	 */
	//% weight=86 blockGap=50 blockId=checkCurrentColor block="Current color %color"
	export function checkCurrentColor(color: Colors): boolean {
		let r = readRedLight();
		let g = readGreenLight();
		let b = readBlueLight();
        let t = Colors.Red;
        
        // serial.writeLine("rgb:");
        // serial.writeNumber(r);
        // serial.writeLine(" ");
        // serial.writeNumber(g);
        // serial.writeLine(" ");
        // serial.writeNumber(b);

        if (r < r_f || r > R_F || g < g_f || g > G_F || b < b_f || b > B_F)
        {
           // serial.writeLine("none1");
            return false; 
        }       

		r = mapRGB(r, r_f, R_F, 0, 255);
		g = mapRGB(g, g_f, G_F, 0, 255);
        b = mapRGB(b, b_f, B_F, 0, 255);
        
        // serial.writeLine("rgb:");
        // serial.writeNumber(r);
        // serial.writeLine(" ");
        // serial.writeNumber(g);
        // serial.writeLine(" ");
        // serial.writeNumber(b);
        // serial.writeLine(" ");
		if (r > g)
		{
			t = Colors.Red;
		}	
		else
		{
			t = Colors.Green;
		}	

		if (t == Colors.Green && g < b)
		{
			t = Colors.Blue;
		}	
		if (t == Colors.Red && r < b)
		{
			t = Colors.Blue;
		}

		if (t == Colors.Blue && b > 50) {
           // serial.writeLine("blue");
		}
		else if (t == Colors.Green && g > 50) {
           // serial.writeLine("green");
		}
		else if (t == Colors.Red && r > 50) {
			//serial.writeLine("red");
		}
		else
        {
            //serial.writeLine("none");
            return false;
        }		
        return (color == t);
	}

	function mapRGB(x: number, in_min: number, in_max: number, out_min: number, out_max: number): number {
		return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }
     

    /**
     * Get the handle command.
     */
    function getHandleCmd() {
        let charStr: string = serial.readString();
        handleCmd = handleCmd.concat(charStr); 
        let cnt: number = countChar(handleCmd, "$");
        let startIndex: number = 0;
        if (cnt == 0)
            return;  
        for (let i = 0; i < cnt;i++)
        {
            let index = findIndexof(handleCmd, "$", startIndex);
            if (index != -1)
            {
                let cmd: string = handleCmd.substr(startIndex, index - startIndex);
                if (cmd.charAt(0).compare("K") == 0 && cmd.length < 9)
                {
                    for(let j = 0;j < cmd.length - 1;j++)
                    {
                        let args: string = cmd.substr(1+j, 1);
                        let argsInt: number = strToNumber(args);
                        if (argsInt == -1)
                        {
                            handleCmd = "";
                            return;
                        }    
                        switch (argsInt)
                        {
                            case 1:
                                control.raiseEvent(EventBusSource.MES_DPAD_CONTROLLER_ID,HandleButton.TOUCHKEY);
                                break;  
                                
                            case 3:
                                control.raiseEvent(EventBusSource.MES_DPAD_CONTROLLER_ID,HandleButton.B1);    
                                break;    
        
                            case 5:
                                control.raiseEvent(EventBusSource.MES_DPAD_CONTROLLER_ID,HandleButton.B2);        
                                break;    
        
                            case 7:
                                control.raiseEvent(EventBusSource.MES_DPAD_CONTROLLER_ID,HandleButton.B3);       
                                break;    
        
                            case 9:
                                 control.raiseEvent(EventBusSource.MES_DPAD_CONTROLLER_ID,HandleButton.B4);  
                                break;    
        
                            case 11:
                                control.raiseEvent(EventBusSource.MES_DPAD_CONTROLLER_ID,HandleButton.JOYSTICK1);           
                                break;  
                                
                            case 13:
                                control.raiseEvent(EventBusSource.MES_DPAD_CONTROLLER_ID,HandleButton.JOYSTICK2);       
                                break;    
        
                            default:
                                break;    
                        }
                    }
                }
                else if (cmd.charAt(0).compare("S") == 0 && cmd.length == 3)
                {
                    let args: string = cmd.substr(1, 2);
                    let argsInt: number = strToNumber(args);
                    if (argsInt == -1)
                    {
                        handleCmd = "";
                        return;
                    }  
                    Sound = argsInt;
                }    
                else if (cmd.charAt(0).compare("L") == 0 && cmd.length == 3)
                {
                    let args: string = cmd.substr(1, 2);
                    let argsInt: number = strToNumber(args);
                    if (argsInt == -1)
                    {
                        handleCmd = "";
                        return;
                    }  
                    Light = 255 - argsInt;
                }    
                else if (cmd.charAt(0).compare("P") == 0 && cmd.length == 5)
                {
                    let args: string = cmd.substr(1, 4);
                    let argsInt: number = strToNumber(args);
                    if (argsInt == -1)
                    {
                        handleCmd = "";
                        return;
                    }  
                    Power = argsInt;
                }    
                else if (cmd.charAt(0).compare("J") == 0 && cmd.length == 9)
                {
                    let args: string = cmd.substr(1, 2);
                    let argsInt: number = strToNumber(args);
                    if (argsInt == -1)
                    {
                        handleCmd = "";
                        return;
                    }  
                    JoystickX1 = 255 - argsInt;

                    args = cmd.substr(3, 2);
                    argsInt = strToNumber(args);
                    if (argsInt == -1)
                    {
                        handleCmd = "";
                        return;
                    }  
                    JoystickY1 = argsInt;

                    args = cmd.substr(5, 2);
                    argsInt = strToNumber(args);
                    if (argsInt == -1)
                    {
                        handleCmd = "";
                        return;
                    }  
                    JoystickX2 = 255 - argsInt;

                    args = cmd.substr(7, 2);
                    argsInt = strToNumber(args);
                    if (argsInt == -1)
                    {
                        handleCmd = "";
                        return;
                    }  
                    JoystickY2 = argsInt;
                }  
                else if (cmd.charAt(0).compare("U") == 0 && cmd.length == 5)
                {
                    let args: string = cmd.substr(1, 4);
                    let argsInt: number = strToNumber(args);
                    if (argsInt == -1)
                    {
                        handleCmd = "";
                        return;
                    }  
                    UltrasonicValue = argsInt;
                }  
                else if (cmd.charAt(0).compare("R") == 0 && cmd.length == 3)
                {
                    let args: string = cmd.substr(1, 2);
                    let argsInt: number = strToNumber(args);
                    if (argsInt == -1)
                    {
                        handleCmd = "";
                        return;
                    }  
                    Knob = argsInt;
                }  
                startIndex = index + 1; 
            }   
            
        }    
        if (cnt > 0)
        {
            handleCmd = "";
        }    
    }

    function findIndexof(src: string,strFind: string,startIndex: number): number
    {
        for (let i = startIndex; i < src.length; i++)
        {
            if (src.charAt(i).compare(strFind) == 0)
            {
                return i;
            }    
        }  
        return -1;
    }

    function countChar(src: string, strFind: string): number {
        let cnt: number = 0;
        for (let i = 0; i < src.length; i++)
        {
            if (src.charAt(i).compare(strFind) == 0)
            {
                cnt++;
            }
        }
        return cnt;
    }

    /**
     * Do something when a button is pushed down and released again.
     * @param button the button that needs to be pressed
     * @param body code to run when event is raised
     */
    //% weight=84 blockId=onHandleButtonPressed block="on button|%button|pressed"
    export function onHandleButtonPressed(button: HandleButton,body: Action) {
        control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID,button,body);
    }

    /**
     * Returns the handle sensor value.
     */
    //% weight=82 blockGap=50 blockId=getHandleSensorValue block="handle|%type|sensor value"
    export function getHandleSensorValue(type: HandleSensorValue): number {
        let value: number = 0;
        switch (type)
        {
            case HandleSensorValue.SOUND: value = Sound; break;
            case HandleSensorValue.LIGHT: value = Light; break;   
            case HandleSensorValue.POWER: value = Power; break;       
            case HandleSensorValue.JOYSTICK_X1: value = JoystickX1; break;      
            case HandleSensorValue.JOYSTICK_Y1: value = JoystickY1;break;   
            case HandleSensorValue.JOYSTICK_X2: value = JoystickX2;break;   
            case HandleSensorValue.JOYSTICK_Y2: value = JoystickY2;break;   
            case HandleSensorValue.ULTRASONIC: value = UltrasonicValue;break;     
            case HandleSensorValue.KNOB: value = Knob;break;         
        }
        return value;
    }

    function strToNumber(str: string): number {
        let num: number = 0;
        for (let i = 0; i < str.length; i++)
        {
            let tmp: number = converOneChar(str.charAt(i));
            if (tmp == -1)
                return -1;    
            if (i > 0)
                num *= 16;    
            num += tmp;
        }    
        return num;
    }

    function converOneChar(str: string): number {
        if (str.compare("0") >= 0 && str.compare("9") <= 0) {
            return parseInt(str);
        }
        else if (str.compare("A") >= 0 && str.compare("F") <= 0) {
            if (str.compare("A") == 0) {
                return 10;
            }
            else if (str.compare("B") == 0) {
                return 11;
            }
            else if (str.compare("C") == 0) {
                return 12;
            }
            else if (str.compare("D") == 0) {
                return 13;
            }
            else if (str.compare("E") == 0) {
                return 14;
            }
            else if (str.compare("F") == 0) {
                return 15;
            }
            return -1;  
        }
        else
            return -1; 
    }
    
    /**
     *  The Melody of Little star   
     */
    //% weight=80 blockId=littleStarMelody block="Little star melody"
    export function littleStarMelody(): string[] {
        return ["C4:4", "C4:4", "G4:4", "G4:4", "A4:4", "A4:4", "G4:4", "F4:4", "F4:4", "E4:4", "E4:4", "D4:4", "D4:4", "C4:4", "G4:4", "G4:4", "F4:4", "F4:4", "E4:4", "E4:4", "D4:4", "G4:4", "G4:4", "F4:4", "F4:4", "E4:4", "E4:4", "D4:4", "C4:4", "C4:4", "G4:4", "G4:4", "A4:4", "A4:4", "G4:4", "F4:4", "F4:4", "E4:4", "E4:4", "D4:4", "D4:4", "C4:4"];
    }
    
    
}
