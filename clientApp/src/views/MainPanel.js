import {useState, useEffect, useCallback} from 'react';
import {Panel, Header} from '@enact/sandstone/Panels';
import Switch from '@enact/sandstone/Switch';
import Dropdown from '@enact/sandstone/Dropdown';
import TimePicker from '@enact/sandstone/TimePicker';
import Button from '@enact/sandstone/Button';
import * as Paho from 'paho-mqtt';
import './MainPanel.style.css';

// MQTT 클라이언트 설정
const mqtt_host = "192.168.100.102";
const mqtt_port = 8000;
const mqtt_clientId = "clientID-" + parseInt(Math.random() * 100);

// MQTT 클라이언트를 관리하는 커스텀 훅
function useMQTTClient() {
    const [client, setClient] = useState(null);

    useEffect(() => {
        const mqttClient = new Paho.Client(mqtt_host, mqtt_port, mqtt_clientId);

        const onConnect = () => {
            console.log("Connected to MQTT broker");
            setClient(mqttClient);
        };

        const onFailure = (error) => {
            console.log("Connection failed: " + error.errorMessage);
        };

        mqttClient.connect({
            onSuccess: onConnect,
            onFailure: onFailure,
            useSSL: false  // 필요한 경우 SSL 사용
        });

        return () => {
            if (mqttClient.isConnected()) {
                mqttClient.disconnect();
            }
        };
    }, []);

    return client;
}

function TextOnOff({topic, client, name}) {
    const [isSelected, setIsSelected] = useState(false);

    const sendMessage = useCallback((toggleStatus) => {
        if (client && client.isConnected()) {
            const message = new Paho.Message(toggleStatus ? "ON" : "OFF");
            message.destinationName = topic;
            client.send(message);
            console.log(`Message sent to ${topic}: ${message.payloadString}`);
        }
    }, [client, topic]);

    const handleToggle = useCallback((e) => {
        setIsSelected(e.selected);
        sendMessage(e.selected);
    }, [sendMessage]);

    return (
        <div>
            <span>
                <Switch onToggle={handleToggle} />
            </span>
            <span>
                {isSelected ? <span>{name} on</span> : <span>{name} off</span>}
            </span>
        </div>
    );
}

function MainPanel(props) {
    const client = useMQTTClient();

    const { next, socket } = props;

    return (
        <Panel noCloseButton {...props}>
            <Header title="COSMOS IoT Dashboard" />
            <div className="main-container">
				<div className="temp-box box-three">
                    <div>
                       <img src="http://192.168.100.103:8081/stream" alt='img' width="600"/>
                    </div>
                </div>
                <Button onClick={next}>Next Page</Button>
                <Button onClick={socket}>Socket Page</Button>
                <div className="temp-box box-three">
                    <div>
                        <Dropdown
                            className="down"
                            defaultSelected={0}
                            inline
                            title="공간을 선택하십시오 (Light)">
                            {['거실', '안방', '침실1', '침실2', '부엌', '서재']}
                        </Dropdown>
                    </div>
                </div>
                <div className="temp-box box-four">
                    <div>
                        <TextOnOff topic="esp32/led/command" client={client} name='led' />
                    </div>
                    <div>
                        <TextOnOff topic="esp32/waterpump/command" client={client} name='waterpump'/>
                    </div>
                    <div className="time-picker">
                        <TimePicker
                            defaultValue={new Date()}
                            label={"webOS's Time"}
                        />
                    </div>
                </div>
            </div>
        </Panel>
    );
}

export default MainPanel;
