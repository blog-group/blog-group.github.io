import {Component} from "inferno";

/**
 * 横线组件
 */
class Hr extends Component {
    render() {
        const {title} = this.props;
        return <div><h1 class="widget-title">{title}</h1>
            <p style="border:0.5px solid #eee;width:100%"></p></div>;
    }
}

module.exports = Hr;