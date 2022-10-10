import {Component} from "inferno";

/**
 * 广告组件
 */
class Advertising extends Component {
    render() {
        const {widget} = this.props;
        const {adverts} = widget;
        return adverts.map((advert,index)=>{
            return <div class="card widget" style="margin-top: 1rem;">
                <div class="card-content" style="padding: 0">
                    <a href={advert.jump_url} target="_blank">
                        <img src={advert.image_url} style="padding: 0px;height: 130px;width:100%"/>
                    </a>
                </div>
            </div>;
        });
    }
}

module.exports = Advertising;