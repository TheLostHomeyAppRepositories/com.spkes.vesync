import HumidifierDeviceBase from "../../lib/HumidifierDeviceBase";

class Dual200s extends HumidifierDeviceBase {
    private capabilitiesAddition: string[] = [
        "dual200sCapability",
        "fanSpeed0to3",
        "onoff",
        "measure_humidity",
        "alarm_water_lacks"
    ]

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        await super.onInit();

        this.registerCapabilityListener("onoff", async (value) => {
            if (!value) this.setCapabilityValue("dual200sCapability", "off").then();
            await this.setMode(value ? "on" : "off");
            await this.updateDevice();
        });
        this.registerCapabilityListener("dual200sCapability", async (value) => {
            if (value === "off") this.setCapabilityValue("onoff", false).then();
            else this.setCapabilityValue("onoff", true).then();
            await this.setMode(value);
        });
        this.registerCapabilityListener("fanSpeed0to3", async (value) => {
            if (value === 0) this.triggerCapabilityListener("onoff", false).then();
            else {
                this.setCapabilityValue("onoff", true).then();
                this.setCapabilityValue("dual200sCapability", "manual").then();
                await this.setMode("fan_speed_" + value);
            }
        });

        this.capabilitiesAddition.forEach((c) => this.checkForCapability(c));

        this.log('Dual200s has been initialized');
    }

    async setMode(value: string) {
        if (!this.device.isConnected()) {
            this.error("Dual200S is not connected");
            return;
        }
    }

    async updateDevice(): Promise<void> {
        await super.updateDevice();
        if (this.device.isConnected()) {
            this.setCapabilityValue('onoff', this.device.isOn()).catch(this.error);
            if (this.hasCapability("dual200sCapability")) {
                if (this.device.mode === "manual")
                    this.setCapabilityValue('dual200sCapability', "manual").catch(this.error);
                if (this.device.mode === "sleep")
                    this.setCapabilityValue('dual200sCapability', "sleep").catch(this.error);
                if (this.device.mode === "auto")
                    this.setCapabilityValue('dual200sCapability', "auto").catch(this.error);
                if (!this.device.isOn())
                    this.setCapabilityValue('dual200sCapability', "off").catch(this.error);
            }
        }
        this.log("Updating device status!");
    }

    async onAdded() {
        this.log('Dual200s has been added');
    }

    async onSettings({oldSettings: {}, newSettings: {}, changedKeys: []}): Promise<string | void> {
        this.log('Dual200s settings where changed');
    }

    async onRenamed(name: string) {
        this.log('Dual200s was renamed');
    }

    async onDeleted() {
        this.log('Dual200s has been deleted');
    }

}

module.exports = Dual200s;
