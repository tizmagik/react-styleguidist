import React, { PropTypes } from 'react';
import ReactModal from 'react-modal';

/**
 * Modal dialog (actually just a [react-modal](https://github.com/rackt/react-modal) wrapper).
 * @returns {Component}
 */
const Modal = ({ isOpen, children }) => {
	const style = {
		overlay: {
			zIndex: 999,
		},
	};

	return (
		<ReactModal style={style} isOpen={isOpen}>{children}</ReactModal>
	);
};

Modal.prototype.propTypes = {
	isOpen: PropTypes.bool,
	children: PropTypes.node.isRequired,
};

export default Modal;
