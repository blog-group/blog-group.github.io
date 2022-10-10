import {Component} from "inferno";
import {require} from "hexo-component-inferno/lib/core/view";
const Hr = require('./common/hr')
/**
 * 专题列表
 */
class Topic extends Component {
    render() {
        const {widget} = this.props;
        const {projects} = widget;
        const projectElements =projects.map((project) =>
            <div class="card-content" style="font-size: 14px;padding-top: 1rem;">
                <ul class="project">
                    <li>
                        <div class="project-left">
                            <img src={project.image} alt={project.title}/>
                        </div>
                        <div class="project-right">
                            <a href={project.url} target="_blank">
                                <p class="title">{project.title}</p>
                                <p class="desc">{project.desc}</p>
                            </a>
                        </div>
                    </li>
                </ul>
            </div>
        );
        return <div class="card widget">{<Hr title="热门专题"/>}{projectElements}</div>;
    }
}

module.exports = Topic;