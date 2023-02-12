import Homey from 'homey';
import VeSyncDeviceInterface from "../../lib/VeSyncDeviceInterface";
import VeSyncApp from "../../app";
import VeSyncPurifier from '../../tsvesync/veSyncPurifier';
import VeSync from '../../tsvesync/veSync';

class Core300S extends Homey.Device implements VeSyncDeviceInterface {
    device!: VeSyncPurifier;
    checkInterval: NodeJS.Timeout | undefined;
    private updateInterval!: NodeJS.Timer;

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        await this.getDevice().catch(this.log);
        this.registerCapabilityListener("onoff", async (value) => await this.setMode(value ? "on" : "off"));
        this.registerCapabilityListener("core300SCapability", async (value) => await this.setMode(value));
        this.registerFlows();
        this.updateDevice();
        this.log('Core300S has been initialized');
    }

    async setMode(value: string) {
        if (!this.device.isConnected()) {
            this.handleError("Core300S is not connected");
            return;
        }
        this.log("Mode: " + value);
        if (value === "on" || value === "manual") {
            this.device?.toggleSwitch(true).catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', true).catch(this.error);
            this.setCapabilityValue('core300SCapability',
                ["fan_speed_1", "fan_speed_2", "fan_speed_3", "fan_speed_4", "fan_speed_5"]
                    [this.device.level - 1 ?? 1] ?? "fan_speed_1").catch(this.error);
            return;
        }
        if (value === "off") {
            this.device?.toggleSwitch(false).catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', false).catch(this.error);
            this.setCapabilityValue('core300SCapability', "off").catch(this.error);
            return;
        }
        if (value === "fan_speed_1") {
            this.device?.setFanSpeed(1).catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
        if (value === "fan_speed_2") {
            this.device?.setFanSpeed(2).catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
        if (value === "fan_speed_3") {
            this.device?.setFanSpeed(3).catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
        if (value === "fan_speed_4") {
            this.device?.setFanSpeed(4).catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
        if (value === "fan_speed_5") {
            this.device?.setFanSpeed(5).catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
        if (value === "sleep") {
            if (this.device?.deviceStatus === 'off')
                this.device?.on().catch(this.handleError.bind(this));
            this.device?.setMode('sleep').catch(this.handleError.bind(this));
            this.setCapabilityValue('onoff', true).catch(this.error);
            return;
        }
    }

    public async getDevice(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let veSync: VeSync = (this.homey.app as VeSyncApp).veSync;
            if (veSync === null || !veSync.isLoggedIn()) {
                await this.setUnavailable(this.homey.__("devices.failed_login"));
                return reject("Failed to login. Please use the repair function.");
            }
            let device = veSync.getStoredDevice().find(d => d.uuid === this.getData().id);
            if (device === undefined || !(device instanceof VeSyncPurifier)) {
                this.error("Device is undefined or is not a Core300S");
                await this.setUnavailable(this.homey.__("devices.not_found"));
                return reject("Device is undefined or is not a Core300S");
            }
            this.device = device as VeSyncPurifier;
            if (this.device.isConnected()) {
                await this.setAvailable();
                return resolve();
            }
            await this.setDeviceOffline();
            return reject("Cannot get device status. Device is " + this.device.connectionStatus);
        })
    }

    public registerFlows(): void {
        this.homey.flow.getActionCard("setModeCore300s").registerRunListener(async (args) => await this.setMode(args.mode));
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
        this.log('Core300S has been added');
    }

    /**
     * onSettings is called when the user updates the device's settings.
     * @param {object} event the onSettings event data
     * @param {object} event.oldSettings The old settings object
     * @param {object} event.newSettings The new settings object
     * @param {string[]} event.changedKeys An array of keys changed since the previous version
     * @returns {Promise<string|void>} return a custom message that will be displayed
     */
    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('Core300S settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name: string) {
        this.log('Core300S was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.log('Core300S has been deleted');
    }

    updateDevice(): void {
        this.updateInterval = setInterval(async () => {
            //night_light, child_lock, display
            await this.device.getStatus().catch(this.error);
            this.setCapabilityValue('onoff', this.device.deviceStatus === "on").catch(this.error);
            if (this.hasCapability("core300SCapability") && this.device.deviceStatus === "on") {
                if (this.device.mode === "manual") {
                    this.setCapabilityValue('core300SCapability',
                        ["fan_speed_1", "fan_speed_2", "fan_speed_3", "fan_speed_4", "fan_speed_5"]
                            [this.device.level - 1 ?? 1] ?? "fan_speed_1").catch(this.error);
                } else if (this.device.mode === "sleep")
                    this.setCapabilityValue('core300SCapability', "sleep").catch(this.error);
                else if (this.device.mode === "auto")
                    this.setCapabilityValue('core300SCapability', "auto").catch(this.error);
            }

            if (this.hasCapability("measure_pm25") && this.device.getDeviceFeatures().features.includes('air_quality'))
                await this.setCapabilityValue('measure_pm25', this.device.air_quality_value)
            if (this.hasCapability("measure_filter_life"))
                this.setCapabilityValue("measure_filter_life", this.device.filter_life).catch(this.error);

            this.log("Updating device status!");
        }, 1000 * 60) //Every 5min
        this.log("Update Interval has be started!")
    }
    private handleError(error: any) {
        if (!this.device?.isConnected())
            this.setDeviceOffline().catch(this.error);
        else
            this.error(error)
    }

    private async setDeviceOffline() {
        await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
        await this.setCapabilityValue('onoff', false).catch(this.error);
        if (this.checkInterval === undefined)
            this.checkInterval = setInterval(async () => {
                await this.device?.getStatus().catch(() => this.log("Still offline...."));
                if (this.device?.isConnected()) {
                    await this.setAvailable().catch(this.error);
                    this.log("Device is online.");
                    if (this.checkInterval !== undefined)
                        clearInterval(this.checkInterval)
                } else if (this.getAvailable()) {
                    await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
                    await this.setCapabilityValue('onoff', false).catch(this.error);
                }
            }, 60 * 1000)
    }

}

module.exports = Core300S;
